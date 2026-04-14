import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { listJournalEntries, createJournalEntry, voidJournalEntry, listJournalLines, listAccounts, getTrialBalance } from "../lib/erpApi";
import type { JournalEntryRow, JournalLineRow, AccountRow } from "../lib/erpApi";

type DraftLine = { id: string; account_id: string; account_name: string; debit: number; credit: number };
function uid() { return "id_" + Math.random().toString(16).slice(2); }
function money(n: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0)); }

export default function GeneralLedger() {
  const { t } = useTranslation();
  const [tab, setTab]             = useState<"entries"|"trial"|"accounts">("entries");
  const [entries, setEntries]     = useState<JournalEntryRow[]>([]);
  const [accounts, setAccounts]   = useState<AccountRow[]>([]);
  const [trial, setTrial]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<JournalEntryRow | null>(null);
  const [lines, setLines]         = useState<JournalLineRow[]>([]);
  const [showForm, setShowForm]   = useState(false);
  const [ref, setRef]             = useState("");
  const [memo, setMemo]           = useState("");
  const [draftLines, setDraftLines] = useState<DraftLine[]>([{ id: uid(), account_id: "", account_name: "", debit: 0, credit: 0 }, { id: uid(), account_id: "", account_name: "", debit: 0, credit: 0 }]);
  const totalDebit  = useMemo(() => draftLines.reduce((s: number, l: DraftLine) => s + Number(l.debit), 0), [draftLines]);
  const totalCredit = useMemo(() => draftLines.reduce((s: number, l: DraftLine) => s + Number(l.credit), 0), [draftLines]);
  const balanced    = Math.abs(totalDebit - totalCredit) < 0.001;

  async function refresh() {
    setLoading(true);
    try {
      const [es, as, tb] = await Promise.all([listJournalEntries(), listAccounts(), getTrialBalance()]);
      setEntries(es); setAccounts(as); setTrial(tb);
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  }
  async function loadLines(entry: JournalEntryRow) {
    setSelected(entry);
    try { setLines(await listJournalLines(entry.id)); } catch (e: any) { alert(e.message); }
  }
  useEffect(() => { refresh(); }, []);

  function updateLine(id: string, field: keyof DraftLine, value: string | number) {
    setDraftLines((prev: DraftLine[]) => prev.map((l: DraftLine) => {
      if (l.id !== id) return l;
      if (field === "account_id") {
        const acc = accounts.find((a: AccountRow) => a.id === value);
        return { ...l, account_id: value as string, account_name: acc?.name ?? "" };
      }
      return { ...l, [field]: value };
    }));
  }
  function addDraftLine() { setDraftLines((prev: DraftLine[]) => [...prev, { id: uid(), account_id: "", account_name: "", debit: 0, credit: 0 }]); }
  function removeDraftLine(id: string) { if (draftLines.length <= 2) return; setDraftLines((prev: DraftLine[]) => prev.filter((l: DraftLine) => l.id !== id)); }

  async function handlePost() {
    if (!ref.trim()) return alert(t("ledger.reference"));
    if (!balanced) return alert(t("ledger.notBalanced") + " " + Math.abs(totalDebit - totalCredit).toFixed(2));
    const validLines = draftLines.filter((l: DraftLine) => l.account_id && (l.debit > 0 || l.credit > 0));
    if (validLines.length < 2) return alert(t("ledger.addLine"));
    try {
      await createJournalEntry({
        entry_date: new Date().toISOString().slice(0, 10),
        reference: ref,
        memo,
        lines: validLines.map((l: DraftLine) => ({ account_id: l.account_id, account_code: "", account_name: l.account_name, debit: l.debit, credit: l.credit }))
      });
      setRef(""); setMemo(""); setDraftLines([{ id: uid(), account_id: "", account_name: "", debit: 0, credit: 0 }, { id: uid(), account_id: "", account_name: "", debit: 0, credit: 0 }]);
      setShowForm(false); await refresh();
    } catch (e: any) { alert(e.message); }
  }

  async function handleVoid(id: string) {
    if (!confirm(t("ledger.voidConfirm"))) return;
    try { await voidJournalEntry(id as any); await refresh(); if (selected?.id === id) setSelected(null); } catch (e: any) { alert(e.message); }
  }

  const STATUS_COLORS: Record<string, string> = { posted: "badge-success", void: "badge-danger", draft: "badge-primary" };
  const tabStyle = (v: string) => ({ padding: "8px 18px", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", border: "1px solid " + (tab === v ? "var(--primary)" : "var(--border)"), background: tab === v ? "var(--primary-light, #eff6ff)" : "white", color: tab === v ? "var(--primary)" : "var(--text)" });

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1 className="pageTitle">{t("ledger.title")}</h1><div className="pageSub">{t("ledger.subtitle")}</div></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={refresh}>🔄 {t("common.refresh")}</button>
          {tab === "entries" && <button className="btn btnPrimary" onClick={() => setShowForm(!showForm)}>{showForm ? t("common.cancel") : t("ledger.newEntry")}</button>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button style={tabStyle("entries")}  onClick={() => setTab("entries")}>📝 {t("ledger.journalEntries")}</button>
        <button style={tabStyle("trial")}    onClick={() => setTab("trial")}>⚖️ {t("ledger.trialBalance")}</button>
        <button style={tabStyle("accounts")} onClick={() => setTab("accounts")}>📋 {t("ledger.chartOfAccounts")}</button>
      </div>

      {tab === "entries" && (
        <>
          {showForm && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>{t("ledger.newJournalEntry")}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 16 }}>
                <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("ledger.reference")} *</div><input className="input" placeholder="JE-001" value={ref} onChange={e => setRef(e.target.value)} /></div>
                <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("common.description")}</div><input className="input" value={memo} onChange={e => setMemo(e.target.value)} /></div>
              </div>
              <table className="table" style={{ marginBottom: 12 }}>
                <thead><tr><th>{t("ledger.account")}</th><th>{t("ledger.debit")}</th><th>{t("ledger.credit")}</th><th></th></tr></thead>
                <tbody>
                  {draftLines.map((l: DraftLine) => (
                    <tr key={l.id}>
                      <td><select className="input" value={l.account_id} onChange={e => updateLine(l.id, "account_id", e.target.value)}>
                        <option value="">{t("ledger.account")}...</option>
                        {accounts.map((a: AccountRow) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                      </select></td>
                      <td><input className="input" type="number" min={0} step="0.01" value={l.debit} onChange={e => updateLine(l.id, "debit", Number(e.target.value))} /></td>
                      <td><input className="input" type="number" min={0} step="0.01" value={l.credit} onChange={e => updateLine(l.id, "credit", Number(e.target.value))} /></td>
                      <td><button className="btn btnDanger" style={{ padding: "4px 8px" }} onClick={() => removeDraftLine(l.id)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr style={{ background: "#f8fafc" }}>
                  <td style={{ padding: "10px 16px", fontWeight: 700 }}>{t("common.total")}</td>
                  <td style={{ padding: "10px 16px", fontWeight: 700, color: balanced ? "var(--success)" : "var(--danger)" }}>{money(totalDebit)}</td>
                  <td style={{ padding: "10px 16px", fontWeight: 700, color: balanced ? "var(--success)" : "var(--danger)" }}>{money(totalCredit)}</td>
                  <td></td>
                </tr></tfoot>
              </table>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn" onClick={addDraftLine}>{t("ledger.addLine")}</button>
                  <span style={{ fontSize: 13, color: balanced ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>
                    {balanced ? t("ledger.balanced") : t("ledger.notBalanced") + " " + money(Math.abs(totalDebit - totalCredit))}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn" onClick={() => setShowForm(false)}>{t("common.cancel")}</button>
                  <button className="btn btnPrimary" onClick={handlePost} disabled={!balanced}>{t("ledger.postEntry")}</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 16, alignItems: "start" }}>
            <div className="card">
              <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>{t("ledger.journalEntries")}</div>
              {loading ? <div style={{ padding: 20, color: "var(--muted)" }}>{t("common.loading")}</div> : entries.length === 0 ? <div style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>{t("ledger.noEntries")}</div> :
                entries.map((e: JournalEntryRow) => (
                  <div key={e.id} onClick={() => loadLines(e)} style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: selected?.id === e.id ? "var(--primary-light, #eff6ff)" : "white" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div style={{ fontWeight: 700 }}>{e.reference}</div>
                      <span className={`badge ${STATUS_COLORS[e.status] ?? "badge"}`}>{e.status}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>{new Date(e.created_at).toLocaleDateString()}</span>
                      {e.status === "posted" && <button className="btn btnDanger" style={{ fontSize: 11, padding: "2px 8px" }} onClick={ev => { ev.stopPropagation(); handleVoid(e.id); }}>{t("ledger.void")}</button>}
                    </div>
                  </div>
                ))
              }
            </div>
            <div className="card">
              {!selected ? <div style={{ padding: 40, color: "var(--muted)", textAlign: "center" }}>👈 {t("ledger.selectEntry")}</div> : (
                <>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{selected.reference}</div>
                  </div>
                  <table className="table">
                    <thead><tr><th>{t("ledger.account")}</th><th style={{ textAlign: "right" }}>{t("ledger.debit")}</th><th style={{ textAlign: "right" }}>{t("ledger.credit")}</th></tr></thead>
                    <tbody>{lines.map((l: JournalLineRow) => (
                      <tr key={l.id}>
                        <td>{l.account_name ?? l.account_id}</td>
                        <td style={{ textAlign: "right", color: Number(l.debit) > 0 ? "var(--success)" : "var(--muted)" }}>{Number(l.debit) > 0 ? money(l.debit) : "—"}</td>
                        <td style={{ textAlign: "right", color: Number(l.credit) > 0 ? "var(--danger)" : "var(--muted)" }}>{Number(l.credit) > 0 ? money(l.credit) : "—"}</td>
                      </tr>
                    ))}</tbody>
                    <tfoot><tr style={{ fontWeight: 700, background: "#f8fafc" }}>
                      <td style={{ padding: "10px 16px" }}>{t("common.total")}</td>
                      <td style={{ padding: "10px 16px", textAlign: "right" }}>{money(lines.reduce((s: number, l: JournalLineRow) => s + Number(l.debit), 0))}</td>
                      <td style={{ padding: "10px 16px", textAlign: "right" }}>{money(lines.reduce((s: number, l: JournalLineRow) => s + Number(l.credit), 0))}</td>
                    </tr></tfoot>
                  </table>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {tab === "trial" && (
        <div className="card">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>{t("ledger.trialBalance")}</div>
          {loading ? <div style={{ padding: 20, color: "var(--muted)" }}>{t("common.loading")}</div> : trial.length === 0 ? <div style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>{t("ledger.noData")}</div> : (
            <>
              <table className="table">
                <thead><tr><th>{t("ledger.account")}</th><th style={{ textAlign: "right" }}>{t("ledger.totalDebit")}</th><th style={{ textAlign: "right" }}>{t("ledger.totalCredit")}</th><th style={{ textAlign: "right" }}>{t("ledger.balance")}</th></tr></thead>
                <tbody>{trial.map((row: any) => (
                  <tr key={row.account_id}>
                    <td style={{ fontWeight: 600 }}>{row.account_name}</td>
                    <td style={{ textAlign: "right" }}>{money(row.total_debit)}</td>
                    <td style={{ textAlign: "right" }}>{money(row.total_credit)}</td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: Number(row.balance) >= 0 ? "var(--success)" : "var(--danger)" }}>{money(row.balance)}</td>
                  </tr>
                ))}</tbody>
                <tfoot><tr style={{ fontWeight: 700, background: "#f8fafc" }}>
                  <td style={{ padding: "10px 16px" }}>{t("common.total")}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right" }}>{money(trial.reduce((s: number, r: any) => s + Number(r.total_debit), 0))}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right" }}>{money(trial.reduce((s: number, r: any) => s + Number(r.total_credit), 0))}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right" }}>{money(trial.reduce((s: number, r: any) => s + Number(r.balance), 0))}</td>
                </tr></tfoot>
              </table>
              <div style={{ padding: "12px 16px", background: "#f0fdf4", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "var(--success)", fontWeight: 700 }}>✅ {t("ledger.balancedLabel")}</span>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "accounts" && (
        <div className="card">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>{t("ledger.chartOfAccounts")} ({accounts.length} {t("ledger.accounts")})</div>
          {loading ? <div style={{ padding: 20, color: "var(--muted)" }}>{t("common.loading")}</div> : (
            <table className="table">
              <thead><tr><th>{t("ledger.code")}</th><th>{t("ledger.account")}</th><th>{t("common.type")}</th><th>{t("ledger.subtype")}</th></tr></thead>
              <tbody>{accounts.map((a: AccountRow) => (
                <tr key={a.id}>
                  <td style={{ fontFamily: "monospace", color: "var(--muted)" }}>{a.code}</td>
                  <td style={{ fontWeight: 600 }}>{a.name}</td>
                  <td><span className="badge badge-primary">{a.type}</span></td>
                  <td style={{ color: "var(--muted)" }}>{a.subtype ?? "—"}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
