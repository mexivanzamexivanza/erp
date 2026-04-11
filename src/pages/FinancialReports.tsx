import { printElement } from "../lib/pdfExport";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getFinancialReport } from "../lib/erpApi";

function money(n: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n); }

function getDefaultRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { start, end };
}

type Report = { revenue: number; cogs: number; grossProfit: number; payroll: number; operatingExpenses: number; netIncome: number; collected: number };

export default function FinancialReports() {
  const { t } = useTranslation();
  const def = getDefaultRange();
  const [startDate, setStartDate] = useState(def.start);
  const [endDate, setEndDate]     = useState(def.end);
  const [report, setReport]       = useState<Report | null>(null);
  const [loading, setLoading]     = useState(false);
  const [tab, setTab]             = useState<"pl" | "balance" | "cashflow">("pl");

  async function load() {
    setLoading(true);
    try { setReport(await getFinancialReport(startDate, endDate)); }
    catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const tabStyle = (t2: string) => ({
    padding: "8px 18px", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer",
    border: "1px solid " + (tab === t2 ? "var(--primary)" : "var(--border)"),
    background: tab === t2 ? "var(--primary)" : "white", color: tab === t2 ? "white" : "var(--text)",
  });

  function PnLRow({ label, value, bold, indent, color }: { label: string; value: number; bold?: boolean; indent?: boolean; color?: string }) {
    return (
      <tr style={{ background: bold ? "#f8fafc" : "white" }}>
        <td style={{ padding: "12px 20px", paddingLeft: indent ? 36 : 20, fontWeight: bold ? 700 : 400, color: "var(--text)" }}>{label}</td>
        <td style={{ padding: "12px 20px", textAlign: "right", fontWeight: bold ? 700 : 400, color: color ?? (value < 0 ? "var(--danger)" : "var(--text)") }}>{money(value)}</td>
        <td style={{ padding: "12px 20px", textAlign: "right", color: "var(--muted)", fontSize: 12 }}>
          {report && report.revenue > 0 ? `${((value / report.revenue) * 100).toFixed(1)}%` : "—"}
        </td>
      </tr>
    );
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1 className="pageTitle">{t("reports.title")}</h1><div className="pageSub">{t("reports.subtitle")}</div></div>
      </div>

      {/* Date Range */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("reports.startDate")}</div><input className="input" type="date" style={{ width: 160 }} value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
          <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("reports.endDate")}</div><input className="input" type="date" style={{ width: 160 }} value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
          {[
            { label: t("reports.thisMonth"),  fn: () => { const d = getDefaultRange(); setStartDate(d.start); setEndDate(d.end); } },
            { label: t("reports.thisYear"),   fn: () => { const y = new Date().getFullYear(); setStartDate(`${y}-01-01`); setEndDate(`${y}-12-31`); } },
            { label: t("reports.lastMonth"),  fn: () => { const n = new Date(); const s = new Date(n.getFullYear(), n.getMonth()-1, 1); const e2 = new Date(n.getFullYear(), n.getMonth(), 0); setStartDate(s.toISOString().slice(0,10)); setEndDate(e2.toISOString().slice(0,10)); } },
          ].map(b => <button key={b.label} className="btn" onClick={b.fn}>{b.label}</button>)}
          <button className="btn btnPrimary" onClick={load} disabled={loading}>{loading ? t("common.loading") : "🔄 " + t("reports.generate")}</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8 }}>
        <button style={tabStyle("pl")}       onClick={() => setTab("pl")}>📊 {t("reports.pl")}</button>
        <button style={tabStyle("balance")}  onClick={() => setTab("balance")}>⚖️ {t("reports.balance")}</button>
        <button style={tabStyle("cashflow")} onClick={() => setTab("cashflow")}>💧 {t("reports.cashflow")}</button>
      </div>

      {loading && <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>{t("common.loading")}</div>}

      {!loading && report && tab === "pl" && (
        <div className="card">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>📊 {t("reports.pl")}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{startDate} → {endDate}</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#f8fafc" }}>
              <th style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>{t("reports.item")}</th>
              <th style={{ padding: "10px 20px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>{t("common.amount")}</th>
              <th style={{ padding: "10px 20px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>% {t("reports.ofRevenue")}</th>
            </tr></thead>
            <tbody>
              <PnLRow label={t("reports.revenue")}           value={report.revenue}           bold color="var(--success)" />
              <PnLRow label={t("reports.cogs")}              value={-report.cogs}             indent />
              <PnLRow label={t("reports.grossProfit")}       value={report.grossProfit}       bold color={report.grossProfit >= 0 ? "var(--success)" : "var(--danger)"} />
              <PnLRow label={t("reports.operatingExpenses")} value={0}                        bold />
              <PnLRow label={t("reports.payrollExpense")}    value={-report.payroll}          indent />
              <PnLRow label={t("reports.netIncome")}         value={report.netIncome}         bold color={report.netIncome >= 0 ? "var(--success)" : "var(--danger)"} />
            </tbody>
          </table>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderTop: "1px solid var(--border)" }}>
            {[
              { label: t("reports.grossMargin"), value: report.revenue > 0 ? `${((report.grossProfit/report.revenue)*100).toFixed(1)}%` : "—", color: "var(--success)" },
              { label: t("reports.netMargin"),   value: report.revenue > 0 ? `${((report.netIncome/report.revenue)*100).toFixed(1)}%`   : "—", color: report.netIncome >= 0 ? "var(--success)" : "var(--danger)" },
              { label: t("reports.cashCollected"), value: money(report.collected), color: "var(--primary)" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "16px 20px", borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && report && tab === "balance" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { title: "🏦 " + t("reports.assets"), items: [{ label: t("reports.cashCollected"), value: report.collected }, { label: t("reports.totalRevenue"), value: report.revenue }], color: "var(--primary)" },
            { title: "📋 " + t("reports.liabilities"), items: [{ label: t("reports.cogs"), value: report.cogs }, { label: t("reports.payrollExpense"), value: report.payroll }], color: "var(--danger)" },
          ].map((section) => (
            <div key={section.title} className="card">
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", fontWeight: 700, color: section.color }}>{section.title}</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>{section.items.map(item => (
                  <tr key={item.label}>
                    <td style={{ padding: "12px 20px" }}>{item.label}</td>
                    <td style={{ padding: "12px 20px", textAlign: "right", fontWeight: 600 }}>{money(item.value)}</td>
                  </tr>
                ))}</tbody>
                <tfoot><tr style={{ background: "#f8fafc" }}>
                  <td style={{ padding: "12px 20px", fontWeight: 700 }}>{t("common.total")}</td>
                  <td style={{ padding: "12px 20px", textAlign: "right", fontWeight: 700, color: section.color }}>{money(section.items.reduce((s, i) => s + i.value, 0))}</td>
                </tr></tfoot>
              </table>
            </div>
          ))}
          <div className="card" style={{ gridColumn: "1/-1", padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>📈 {t("reports.equity")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              {[
                { label: t("reports.totalAssets"),      value: money(report.collected + report.revenue), color: "var(--primary)" },
                { label: t("reports.totalLiabilities"), value: money(report.cogs + report.payroll),      color: "var(--danger)" },
                { label: t("reports.netEquity"),        value: money(report.netIncome),                  color: report.netIncome >= 0 ? "var(--success)" : "var(--danger)" },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && report && tab === "cashflow" && (
        <div className="card">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: 16 }}>💧 {t("reports.cashflow")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderBottom: "1px solid var(--border)" }}>
            {[
              { label: t("reports.operating"),  value: report.collected - report.payroll, icon: "⚙️" },
              { label: t("reports.investing"),  value: 0,                                 icon: "📈" },
              { label: t("reports.financing"),  value: 0,                                 icon: "🏦" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "20px", borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>{s.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.value >= 0 ? "var(--success)" : "var(--danger)", marginTop: 4 }}>{money(s.value)}</div>
              </div>
            ))}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {[
                { label: t("reports.cashCollected"),  value: report.collected,        indent: true },
                { label: t("reports.payrollExpense"), value: -report.payroll,         indent: true },
                { label: t("reports.netCashFlow"),    value: report.collected - report.payroll, bold: true },
              ].map(row => (
                <tr key={row.label} style={{ background: row.bold ? "#f8fafc" : "white" }}>
                  <td style={{ padding: "12px 20px", paddingLeft: row.indent ? 36 : 20, fontWeight: row.bold ? 700 : 400 }}>{row.label}</td>
                  <td style={{ padding: "12px 20px", textAlign: "right", fontWeight: row.bold ? 700 : 400, color: row.value >= 0 ? "var(--success)" : "var(--danger)" }}>{money(row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
