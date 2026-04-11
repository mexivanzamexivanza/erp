import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { listCurrencyRates, upsertCurrencyRate, convertCurrency, listEmailTemplates, saveEmailTemplate, deleteEmailTemplate } from "../lib/erpApi";
import type { CurrencyRateRow, EmailTemplateRow } from "../lib/erpApi";

const CURRENCIES = ["USD","MXN","EUR","GBP","CAD","JPY","BRL","ARS"];
const TEMPLATE_TYPES = ["invoice","purchase_order","payroll","general"];

export default function CurrencyAndTemplates() {
  const { t } = useTranslation();
  const [tab, setTab]             = useState<"currency"|"email">("currency");
  const [rates, setRates]         = useState<CurrencyRateRow[]>([]);
  const [templates, setTemplates] = useState<EmailTemplateRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [fromC, setFromC]         = useState("USD");
  const [toC, setToC]             = useState("MXN");
  const [rateVal, setRateVal]     = useState("");
  const [convertAmt, setConvertAmt] = useState("");
  const [convertFrom, setConvertFrom] = useState("USD");
  const [convertTo, setConvertTo]   = useState("MXN");
  const [tplId, setTplId]         = useState<string|null>(null);
  const [tplName, setTplName]     = useState("");
  const [tplSubject, setTplSubject] = useState("");
  const [tplBody, setTplBody]     = useState("");
  const [tplType, setTplType]     = useState("invoice");
  const [saving, setSaving]       = useState(false);

  async function load() {
    setLoading(true);
    try { const [rs, ts] = await Promise.all([listCurrencyRates(), listEmailTemplates()]); setRates(rs); setTemplates(ts); }
    catch (e: any) { alert(e.message); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function handleSaveRate() {
    if (!rateVal || isNaN(Number(rateVal))) return alert(t("currency.invalidRate"));
    try { await upsertCurrencyRate(fromC, toC, Number(rateVal)); setRateVal(""); await load(); }
    catch (e: any) { alert(e.message); }
  }

  const converted = convertAmt && !isNaN(Number(convertAmt)) ? convertCurrency(Number(convertAmt), rates, convertFrom, convertTo) : null;

  async function handleSaveTemplate() {
    if (!tplName.trim() || !tplSubject.trim() || !tplBody.trim()) return alert(t("email.fieldsRequired"));
    setSaving(true);
    try {
      await saveEmailTemplate({ id: tplId as any, name: tplName, subject: tplSubject, body: tplBody, type: tplType });
      setTplId(null); setTplName(""); setTplSubject(""); setTplBody(""); setTplType("invoice"); await load();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }
  function editTemplate(tpl: EmailTemplateRow) { setTplId(tpl.id); setTplName(tpl.name); setTplSubject(tpl.subject); setTplBody(tpl.body); setTplType(tpl.type); setTab("email"); }
  async function handleDeleteTemplate(id: string) {
    if (!confirm(t("common.confirm"))) return;
    try { await deleteEmailTemplate(id as any); await load(); } catch (e: any) { alert(e.message); }
  }

  const tabStyle = (v: string) => ({ padding: "8px 20px", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", border: "1px solid " + (tab === v ? "var(--primary)" : "var(--border)"), background: tab === v ? "var(--primary)" : "white", color: tab === v ? "white" : "var(--text)" });

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div><h1 className="pageTitle">💱 {t("currency.pageTitle")}</h1><div className="pageSub">{t("currency.pageSubtitle")}</div></div>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={tabStyle("currency")} onClick={() => setTab("currency")}>💱 {t("currency.title")}</button>
        <button style={tabStyle("email")}    onClick={() => setTab("email")}>📧 {t("email.title")}</button>
      </div>

      {tab === "currency" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>📝 {t("currency.updateRate")}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("currency.from")}</div>
                  <select className="input" value={fromC} onChange={e => setFromC(e.target.value)}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select>
                </div>
                <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("currency.to")}</div>
                  <select className="input" value={toC} onChange={e => setToC(e.target.value)}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("currency.rate")}</div>
                <input className="input" type="number" step="0.0001" placeholder="17.1500" value={rateVal} onChange={e => setRateVal(e.target.value)} />
              </div>
              <button className="btn btnPrimary" style={{ width: "100%" }} onClick={handleSaveRate}>{t("currency.saveRate")}</button>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>💱 {t("currency.converter")}</div>
              <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("common.amount")}</div>
                <input className="input" type="number" placeholder="100" value={convertAmt} onChange={e => setConvertAmt(e.target.value)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("currency.from")}</div>
                  <select className="input" value={convertFrom} onChange={e => setConvertFrom(e.target.value)}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select>
                </div>
                <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("currency.to")}</div>
                  <select className="input" value={convertTo} onChange={e => setConvertTo(e.target.value)}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select>
                </div>
              </div>
              {converted !== null && (
                <div style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", borderRadius: 12, padding: 20, textAlign: "center", border: "1px solid #bbf7d0" }}>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>{convertAmt} {convertFrom} =</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "var(--success)" }}>{converted.toFixed(4)}</div>
                  <div style={{ fontSize: 14, color: "var(--muted)", fontWeight: 600 }}>{convertTo}</div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>📊 {t("currency.currentRates")}</div>
            {loading ? <div style={{ padding: 20, color: "var(--muted)" }}>{t("common.loading")}</div> :
             rates.length === 0 ? <div style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>{t("common.noData")}</div> : (
              <table className="table">
                <thead><tr><th>{t("currency.from")}</th><th>{t("currency.to")}</th><th>{t("currency.rate")}</th><th>{t("currency.updated")}</th></tr></thead>
                <tbody>{rates.map(r => (
                  <tr key={r.id}>
                    <td><span className="badge badge-primary" style={{ fontSize: 13 }}>{r.from_currency}</span></td>
                    <td><span className="badge" style={{ fontSize: 13 }}>{r.to_currency}</span></td>
                    <td style={{ fontWeight: 700, fontSize: 16 }}>{Number(r.rate).toFixed(4)}</td>
                    <td style={{ color: "var(--muted)" }}>{new Date(r.updated_at).toLocaleString()}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === "email" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 14 }}>{tplId ? t("email.editTemplate") : t("email.newTemplate")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("email.name")} *</div>
                <input className="input" placeholder={t("email.namePlaceholder")} value={tplName} onChange={e => setTplName(e.target.value)} />
              </div>
              <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("email.type")}</div>
                <select className="input" value={tplType} onChange={e => setTplType(e.target.value)}>
                  {TEMPLATE_TYPES.map(tp => <option key={tp} value={tp}>{t("email.types." + tp)}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1/-1" }}><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("email.subject")} *</div>
                <input className="input" placeholder={t("email.subjectPlaceholder")} value={tplSubject} onChange={e => setTplSubject(e.target.value)} />
              </div>
              <div style={{ gridColumn: "1/-1" }}><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("email.body")} *</div>
                <textarea className="input" rows={7} style={{ resize: "vertical", fontFamily: "monospace", fontSize: 12 }} placeholder={t("email.bodyPlaceholder")} value={tplBody} onChange={e => setTplBody(e.target.value)} />
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>📎 {t("email.variables")}: {"{{customer_name}}"} {"{{total}}"} {"{{date}}"} {"{{reference}}"} {"{{vendor_name}}"}</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
              {tplId && <button className="btn" onClick={() => { setTplId(null); setTplName(""); setTplSubject(""); setTplBody(""); }}>{t("common.cancel")}</button>}
              <button className="btn btnPrimary" onClick={handleSaveTemplate} disabled={saving}>{saving ? t("common.saving") : tplId ? t("common.save") : t("email.createTemplate")}</button>
            </div>
          </div>

          <div className="card">
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>📧 {t("email.templates")} ({templates.length})</div>
            {loading ? <div style={{ padding: 20, color: "var(--muted)" }}>{t("common.loading")}</div> :
             templates.length === 0 ? <div style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>{t("email.noTemplates")}</div> : (
              <table className="table">
                <thead><tr><th>{t("email.name")}</th><th>{t("email.type")}</th><th>{t("email.subject")}</th><th></th></tr></thead>
                <tbody>{templates.map(tp => (
                  <tr key={tp.id}>
                    <td style={{ fontWeight: 600 }}>{tp.name}</td>
                    <td><span className="badge badge-primary">{t("email.types." + tp.type)}</span></td>
                    <td style={{ color: "var(--muted)", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tp.subject}</td>
                    <td style={{ display: "flex", gap: 6 }}>
                      <button className="btn" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => editTemplate(tp)}>✏️ {t("common.edit")}</button>
                      <button className="btn btnDanger" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => handleDeleteTemplate(tp.id)}>✕</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}