import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { listAPAging } from "../lib/erpApi";
import type { APAgingRow } from "../lib/erpApi";
import { printElement } from "../lib/pdfExport";

function money(n: number) { return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(n||0)); }

export default function APAging() {
  const { t } = useTranslation();
  const [rows, setRows]       = useState<APAgingRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setRows(await listAPAging()); } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const totals = rows.reduce((acc,r) => ({
    current: acc.current + Number(r.current??0),
    days30:  acc.days30  + Number(r.days_30??0),
    days60:  acc.days60  + Number(r.days_60??0),
    days90:  acc.days90  + Number(r.days_90??0),
    over90:  acc.over90  + Number(r.over_90??0),
    total:   acc.total   + Number(r.total_due??0),
  }), { current:0, days30:0, days60:0, days90:0, over90:0, total:0 });

  function printReport() {
    const tableRows = rows.map(r => `<tr><td style="font-weight:600">${r.vendor_name}</td><td style="text-align:right">${money(r.current??0)}</td><td style="text-align:right;color:#d97706">${money(r.days_30??0)}</td><td style="text-align:right;color:#dc2626">${money(r.days_60??0)}</td><td style="text-align:right;color:#dc2626">${money(r.days_90??0)}</td><td style="text-align:right;color:#991b1b;font-weight:700">${money(r.over_90??0)}</td><td style="text-align:right;font-weight:700">${money(r.total_due??0)}</td></tr>`).join("");
    printElement("Antigüedad de Cuentas por Pagar", `
      <div class="title">AP Aging — ${new Date().toLocaleDateString()}</div>
      <div class="info-grid">
        <div class="info-box"><div class="info-label">Total Proveedores</div><div class="info-value">${rows.length}</div></div>
        <div class="info-box"><div class="info-label">Total Por Pagar</div><div class="info-value" style="color:#dc2626">${money(totals.total)}</div></div>
      </div>
      <table><thead><tr><th>Proveedor</th><th style="text-align:right">Corriente</th><th style="text-align:right">1-30d</th><th style="text-align:right">31-60d</th><th style="text-align:right">61-90d</th><th style="text-align:right">&gt;90d</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${tableRows}</tbody></table>
    `);
  }

  return (
    <div style={{ display:"grid", gap:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div><h1 className="pageTitle">{t("apAging.title")}</h1><div className="pageSub">{t("apAging.subtitle")}</div></div>
        <div style={{ display:"flex", gap:8 }}>
          <button className="btn" onClick={printReport}>🖨️ PDF</button>
          <button className="btn" onClick={load}>🔄 {t("common.refresh")}</button>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12 }}>
        {[
          { label:t("apAging.current"), value:totals.current, color:"#16a34a" },
          { label:"1-30 días",          value:totals.days30,  color:"#d97706" },
          { label:"31-60 días",         value:totals.days60,  color:"#ea580c" },
          { label:"61-90 días",         value:totals.days90,  color:"#dc2626" },
          { label:">90 días",           value:totals.over90,  color:"#991b1b" },
        ].map((k,i) => (
          <div key={i} className="kpi-card" style={{ borderTop:"3px solid "+k.color }}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ color:k.color,fontSize:22,margin:"8px 0" }}>{money(k.value)}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div style={{ padding:"14px 16px",borderBottom:"1px solid var(--border)",fontWeight:700 }}>{t("apAging.detail")} ({rows.length})</div>
        {loading ? <div style={{ padding:20,color:"var(--muted)" }}>{t("common.loading")}</div> :
         rows.length===0 ? <div style={{ padding:24,color:"var(--muted)",textAlign:"center" }}>{t("common.noData")}</div> : (
          <table className="table">
            <thead><tr><th>{t("apAging.vendor")}</th><th style={{ textAlign:"right" }}>{t("apAging.current")}</th><th style={{ textAlign:"right" }}>1-30d</th><th style={{ textAlign:"right" }}>31-60d</th><th style={{ textAlign:"right" }}>61-90d</th><th style={{ textAlign:"right" }}>&gt;90d</th><th style={{ textAlign:"right" }}>{t("apAging.total")}</th></tr></thead>
            <tbody>{rows.map((r,i)=>(
              <tr key={i}>
                <td style={{ fontWeight:600 }}>{r.vendor_name}</td>
                <td style={{ textAlign:"right",color:"#16a34a" }}>{money(r.current??0)}</td>
                <td style={{ textAlign:"right",color:"#d97706" }}>{money(r.days_30??0)}</td>
                <td style={{ textAlign:"right",color:"#ea580c" }}>{money(r.days_60??0)}</td>
                <td style={{ textAlign:"right",color:"#dc2626" }}>{money(r.days_90??0)}</td>
                <td style={{ textAlign:"right",color:"#991b1b",fontWeight:700 }}>{money(r.over_90??0)}</td>
                <td style={{ textAlign:"right",fontWeight:700 }}>{money(r.total_due??0)}</td>
              </tr>
            ))}</tbody>
            <tfoot>
              <tr style={{ fontWeight:700,background:"#f8fafc" }}>
                <td style={{ padding:"12px 16px" }}>TOTAL</td>
                <td style={{ textAlign:"right",padding:"12px 16px",color:"#16a34a" }}>{money(totals.current)}</td>
                <td style={{ textAlign:"right",padding:"12px 16px" }}>{money(totals.days30)}</td>
                <td style={{ textAlign:"right",padding:"12px 16px" }}>{money(totals.days60)}</td>
                <td style={{ textAlign:"right",padding:"12px 16px" }}>{money(totals.days90)}</td>
                <td style={{ textAlign:"right",padding:"12px 16px",color:"#991b1b" }}>{money(totals.over90)}</td>
                <td style={{ textAlign:"right",padding:"12px 16px" }}>{money(totals.total)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}