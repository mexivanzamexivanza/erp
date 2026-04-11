import { printElement } from "../lib/pdfExport";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { listLeads, createLead, updateLeadStage, deleteLead } from "../lib/erpApi";
import type { CRMLeadRow } from "../lib/erpApi";
import RecordNotes from "../components/RecordNotes";

const STAGES = ["new","contacted","qualified","proposal","negotiation","won","lost"];
const STAGE_COLORS: Record<string,string> = { new:"#6b7280",contacted:"#2563eb",qualified:"#7c3aed",proposal:"#d97706",negotiation:"#ea580c",won:"#16a34a",lost:"#dc2626" };
function money(n: number) { return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(n||0)); }

export default function CRM() {
  const { t } = useTranslation();
  const [leads, setLeads]         = useState<CRMLeadRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<CRMLeadRow | null>(null);
  const [view, setView]           = useState<"pipeline"|"list">("pipeline");
  const [showForm, setShowForm]   = useState(false);
  const [name, setName]           = useState("");
  const [company, setCompany]     = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [stage, setStage]         = useState("new");
  const [dealValue, setDealValue] = useState<number>(0);
  const [owner, setOwner]         = useState("");

  async function load() {
    setLoading(true);
    try { setLeads(await listLeads()); } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!name.trim()) return alert(t("crm.nameRequired"));
    try {
      await createLead({ name, company: company||undefined, email: email||undefined, phone: phone||undefined, stage, deal_value: dealValue||undefined, owner: owner||undefined });
      setName(""); setCompany(""); setEmail(""); setPhone(""); setStage("new"); setDealValue(0); setOwner("");
      setShowForm(false); await load();
    } catch (e: any) { alert(e.message); }
  }
  async function handleStageChange(id: string, s: string) {
    try { await updateLeadStage(id, s); await load(); if (selected?.id === id) setSelected(l => l ? {...l, stage: s} : l); }
    catch (e: any) { alert(e.message); }
  }
  async function handleDelete(id: string) {
    if (!confirm(t("crm.deleteConfirm"))) return;
    try { await deleteLead(id); if (selected?.id === id) setSelected(null); await load(); }
    catch (e: any) { alert(e.message); }
  }

  const totalPipeline = leads.filter(l => l.stage !== "lost").reduce((s,l) => s + Number(l.deal_value||0), 0);
  const wonValue      = leads.filter(l => l.stage === "won").reduce((s,l) => s + Number(l.deal_value||0), 0);
  const tabStyle = (v: string) => ({ padding:"8px 18px", borderRadius:8, fontWeight:600, fontSize:13, cursor:"pointer", border:"1px solid "+(view===v?"var(--primary)":"var(--border)"), background:view===v?"var(--primary)":"white", color:view===v?"white":"var(--text)" });

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1 className="pageTitle">{t("crm.title")}</h1><div className="pageSub">{t("crm.subtitle")}</div></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={load}>🔄 {t("common.refresh")}</button>
          <button className="btn btnPrimary" onClick={() => setShowForm(!showForm)}>{showForm ? t("common.cancel") : t("crm.addLead")}</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: t("crm.totalLeads"),  value: leads.length,                          color: "#2563eb" },
          { label: t("crm.pipeline"),    value: money(totalPipeline),                  color: "#7c3aed" },
          { label: t("crm.won"),         value: leads.filter(l=>l.stage==="won").length, color: "#16a34a" },
          { label: t("crm.wonValue"),    value: money(wonValue),                        color: "#16a34a" },
        ].map((s,i) => (
          <div key={i} className="kpi-card" style={{ borderTop: "3px solid "+s.color }}>
            <div className="kpi-label">{s.label}</div>
            <div className="kpi-value" style={{ color: s.color, fontSize: 26 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 14 }}>{t("crm.newLead")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("common.name")} *</div><input className="input" value={name} onChange={e => setName(e.target.value)} /></div>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("crm.company")}</div><input className="input" value={company} onChange={e => setCompany(e.target.value)} /></div>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("common.email")}</div><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("common.phone")}</div><input className="input" value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("crm.stage")}</div>
              <select className="input" value={stage} onChange={e => setStage(e.target.value)}>
                {STAGES.map(s => <option key={s} value={s}>{t("crm.stages."+s)}</option>)}
              </select>
            </div>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("crm.dealValue")}</div><input className="input" type="number" value={dealValue} onChange={e => setDealValue(Number(e.target.value))} /></div>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("crm.owner")}</div><input className="input" value={owner} onChange={e => setOwner(e.target.value)} /></div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
            <button className="btn" onClick={() => setShowForm(false)}>{t("common.cancel")}</button>
            <button className="btn btnPrimary" onClick={handleCreate}>{t("crm.addLead")}</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button style={tabStyle("pipeline")} onClick={() => setView("pipeline")}>📊 {t("crm.pipelineView")}</button>
        <button style={tabStyle("list")}     onClick={() => setView("list")}>📋 {t("crm.listView")}</button>
      </div>

      {view === "pipeline" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 10, overflowX: "auto" }}>
          {STAGES.map(s => (
            <div key={s} style={{ minWidth: 150 }}>
              <div style={{ background: STAGE_COLORS[s], color: "white", borderRadius: 8, padding: "6px 10px", textAlign: "center", fontWeight: 700, fontSize: 12, marginBottom: 8 }}>
                {t("crm.stages."+s)} ({leads.filter(l => l.stage === s).length})
              </div>
              {leads.filter(l => l.stage === s).map(lead => (
                <div key={lead.id} onClick={() => setSelected(selected?.id === lead.id ? null : lead)}
                  style={{ background: selected?.id === lead.id ? "#eff6ff" : "white", border: "1px solid var(--border)", borderRadius: 10, padding: 10, marginBottom: 8, cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{lead.name}</div>
                  {lead.company && <div style={{ fontSize: 11, color: "var(--muted)" }}>{lead.company}</div>}
                  {lead.deal_value && <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>{money(lead.deal_value)}</div>}
                  <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                    <select style={{ fontSize: 10, borderRadius: 4, border: "1px solid var(--border)", padding: "1px 2px", flex: 1 }}
                      value={lead.stage} onClick={e => e.stopPropagation()} onChange={e => handleStageChange(lead.id, e.target.value)}>
                      {STAGES.map(st => <option key={st} value={st}>{t("crm.stages."+st)}</option>)}
                    </select>
                    <button onClick={e => { e.stopPropagation(); handleDelete(lead.id); }} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--muted)", fontSize:14 }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {view === "list" && (
        <div className="card">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>{t("crm.allLeads")} ({leads.length})</div>
          {loading ? <div style={{ padding: 20, color: "var(--muted)" }}>{t("common.loading")}</div> :
           leads.length === 0 ? <div style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>{t("crm.noLeads")}</div> : (
            <table className="table">
              <thead><tr><th>{t("common.name")}</th><th>{t("crm.company")}</th><th>{t("crm.stage")}</th><th>{t("crm.dealValue")}</th><th>{t("crm.owner")}</th><th></th></tr></thead>
              <tbody>{leads.map(l => (
                <tr key={l.id} style={{ cursor: "pointer", background: selected?.id === l.id ? "var(--primary-light)" : "white" }} onClick={() => setSelected(selected?.id === l.id ? null : l)}>
                  <td style={{ fontWeight: 600 }}>{l.name}</td>
                  <td style={{ color: "var(--muted)" }}>{l.company ?? "—"}</td>
                  <td><span style={{ background: STAGE_COLORS[l.stage], color: "white", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{t("crm.stages."+l.stage)}</span></td>
                  <td style={{ fontWeight: 600 }}>{l.deal_value ? money(l.deal_value) : "—"}</td>
                  <td style={{ color: "var(--muted)" }}>{l.owner ?? "—"}</td>
                  <td><button className="btn btnDanger" style={{ padding: "4px 8px", fontSize: 12 }} onClick={e => { e.stopPropagation(); handleDelete(l.id); }}>✕</button></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}

      {selected && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{selected.name}</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>{selected.company ?? ""} {selected.email ? "· " + selected.email : ""}</div>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--muted)" }}>✕</button>
          </div>
          <RecordNotes entityType="crm_lead" entityId={selected.id} authorName="ERP User" />
        </div>
      )}
    </div>
  );
}