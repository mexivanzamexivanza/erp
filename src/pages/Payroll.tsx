import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { listPayrollRuns, createPayrollRun, approvePayrollRun, deletePayrollRun, listPayrollLines } from "../lib/erpApi";
import type { PayrollRunRow, PayrollLineRow } from "../lib/erpApi";
import { generatePayrollPDF } from "../lib/pdfExport";

function money(n: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0)); }

export default function Payroll() {
  const { t } = useTranslation();
  const [runs, setRuns]           = useState<PayrollRunRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<PayrollRunRow | null>(null);
  const [lines, setLines]         = useState<PayrollLineRow[]>([]);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd]     = useState("");
  const [creating, setCreating]   = useState(false);

  async function refresh() {
    setLoading(true);
    try { setRuns(await listPayrollRuns()); } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  }
  async function loadLines(run: PayrollRunRow) {
    setSelected(run);
    try { setLines(await listPayrollLines(run.id)); } catch (e: any) { alert(e.message); }
  }
  useEffect(() => { refresh(); }, []);

  async function handleCreate() {
    if (!periodStart || !periodEnd) return alert(t("payroll.period"));
    setCreating(true);
    try {
      const run = await createPayrollRun({ period_start: periodStart, period_end: periodEnd });
      await refresh(); await loadLines(run); setPeriodStart(""); setPeriodEnd("");
    } catch (e: any) { alert(e.message); } finally { setCreating(false); }
  }
  async function handleApprove(id: string) {
    if (!confirm(t("payroll.approveConfirm"))) return;
    try { await approvePayrollRun(id as any); await refresh(); if (selected?.id === id) setSelected(r => r ? { ...r, status: "approved" } : r); }
    catch (e: any) { alert(e.message); }
  }
  async function handleDelete(id: string) {
    if (!confirm(t("payroll.deleteConfirm"))) return;
    try { await deletePayrollRun(id as any); if (selected?.id === id) { setSelected(null); setLines([]); } await refresh(); }
    catch (e: any) { alert(e.message); }
  }

  const totals = lines.reduce((acc, l) => ({
    gross: acc.gross + Number(l.gross_salary),
    deductions: acc.deductions + Number(l.tax_amount) + Number(l.other_deductions),
    net: acc.net + Number(l.net_pay),
  }), { gross: 0, deductions: 0, net: 0 });

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1 className="pageTitle">{t("payroll.title")}</h1><div className="pageSub">{t("payroll.subtitle")}</div></div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 14 }}>{t("payroll.newPayrollRun")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("payroll.period")} — {t("common.active")}</div>
            <input className="input" type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("payroll.period")} — {t("common.inactive")}</div>
            <input className="input" type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
          </div>
          <button className="btn btnPrimary" onClick={handleCreate} disabled={creating}>
            {creating ? t("common.loading") : t("payroll.newRun")}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 16, alignItems: "start" }}>
        <div className="card">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>{t("payroll.payrollRuns")}</div>
          {loading ? <div style={{ padding: 20, color: "var(--muted)" }}>{t("common.loading")}</div> :
           runs.length === 0 ? <div style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>{t("payroll.noRuns")}</div> :
           runs.map(r => (
            <div key={r.id} onClick={() => loadLines(r)}
              style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: selected?.id === r.id ? "var(--primary-light)" : "white" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{r.period_start} → {r.period_end}</div>
                <span className={`badge ${r.status === "approved" ? "badge-success" : "badge-primary"}`}>{r.status}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{money(r.total_net)} · {r.employee_count} {t("payroll.employees")}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                {r.status === "draft" && (
                  <button className="btn btnPrimary" style={{ fontSize: 11, padding: "3px 10px" }}
                    onClick={e => { e.stopPropagation(); handleApprove(r.id); }}>{t("payroll.approve")}</button>
                )}
                <button className="btn" style={{ fontSize: 11, padding: "3px 10px" }}
                  onClick={e => { e.stopPropagation(); generatePayrollPDF(r, lines); }}>🖨️ PDF</button>
                <button className="btn btnDanger" style={{ fontSize: 11, padding: "3px 10px" }}
                  onClick={e => { e.stopPropagation(); handleDelete(r.id); }}>🗑</button>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          {!selected ? (
            <div style={{ padding: 40, color: "var(--muted)", textAlign: "center" }}>👈 {t("payroll.selectDetail")}</div>
          ) : (
            <>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{t("payroll.period")}: {selected.period_start} → {selected.period_end}</div>
                  <span className={`badge ${selected.status === "approved" ? "badge-success" : "badge-primary"}`}>{selected.status}</span>
                </div>
                <button className="btn" onClick={() => generatePayrollPDF(selected, lines)}>🖨️ {t("pdf.print")}</button>
              </div>
              {lines.length === 0 ? (
                <div style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>{t("payroll.noEmployees")}</div>
              ) : (
                <>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t("common.name")}</th>
                        <th>{t("employees.department")}</th>
                        <th>{t("payroll.grossSalary")}</th>
                        <th>{t("payroll.tax")}</th>
                        <th>{t("payroll.otherDeductions")}</th>
                        <th>{t("payroll.netPay")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map(l => (
                        <tr key={l.id}>
                          <td style={{ fontWeight: 600 }}>{l.employee_name}</td>
                          <td style={{ color: "var(--muted)" }}>{l.department ?? "—"}</td>
                          <td>{money(l.gross_salary)}</td>
                          <td style={{ color: "var(--danger)" }}>{money(l.tax_amount)}</td>
                          <td style={{ color: "var(--danger)" }}>{money(l.other_deductions)}</td>
                          <td style={{ fontWeight: 700, color: "var(--success)" }}>{money(l.net_pay)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ fontWeight: 700, background: "#f8fafc" }}>
                        <td colSpan={2} style={{ padding: "12px 16px" }}>{t("payroll.totals")}</td>
                        <td style={{ padding: "12px 16px" }}>{money(totals.gross)}</td>
                        <td colSpan={2} style={{ padding: "12px 16px", color: "var(--danger)" }}>{money(totals.deductions)}</td>
                        <td style={{ padding: "12px 16px", color: "var(--success)" }}>{money(totals.net)}</td>
                      </tr>
                    </tfoot>
                  </table>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderTop: "1px solid var(--border)" }}>
                    {[
                      { label: t("payroll.totalGross"),      value: totals.gross,      color: "var(--text)" },
                      { label: t("payroll.totalDeductions"), value: totals.deductions, color: "var(--danger)" },
                      { label: t("payroll.totalNetPay"),     value: totals.net,        color: "var(--success)" },
                    ].map((s, i) => (
                      <div key={i} style={{ padding: "16px 20px", borderRight: i < 2 ? "1px solid var(--border)" : "none", textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{money(s.value)}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}