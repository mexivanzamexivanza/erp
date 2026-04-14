import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { listVendors, createVendor } from "../lib/erpApi";
import type { VendorRow } from "../lib/erpApi";
import RecordNotes from "../components/RecordNotes";

export default function Vendors() {
  const { t } = useTranslation();
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<VendorRow | null>(null);
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try { setVendors(await listVendors()); } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function handleAdd() {
    if (!name.trim()) return alert(t("vendors.nameRequired"));
    setSaving(true);
    try { await createVendor({ name }); setName(""); setEmail(""); setPhone(""); await load(); }
    catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div><h1 className="pageTitle">{t("vendors.title")}</h1><div className="pageSub">{t("vendors.subtitle")}</div></div>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>{t("vendors.addVendor")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
          <div><div style={{ fontSize:12,color:"var(--muted)",marginBottom:4 }}>{t("common.name")} *</div><input className="input" value={name} onChange={e=>setName(e.target.value)} /></div>
          <div><div style={{ fontSize:12,color:"var(--muted)",marginBottom:4 }}>{t("common.email")}</div><input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} /></div>
          <div><div style={{ fontSize:12,color:"var(--muted)",marginBottom:4 }}>{t("common.phone")}</div><input className="input" value={phone} onChange={e=>setPhone(e.target.value)} /></div>
          <button className="btn btnPrimary" onClick={handleAdd} disabled={saving}>{saving?t("common.saving"):t("vendors.addVendor")}</button>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 400px", gap:16, alignItems:"start" }}>
        <div className="card">
          <div style={{ padding:"14px 16px",borderBottom:"1px solid var(--border)",fontWeight:700 }}>{t("vendors.list")} ({vendors.length})</div>
          {loading ? <div style={{ padding:20,color:"var(--muted)" }}>{t("common.loading")}</div> :
           vendors.length===0 ? <div style={{ padding:24,color:"var(--muted)",textAlign:"center" }}>{t("common.noData")}</div> : (
            <table className="table">
              <thead><tr><th>{t("common.name")}</th><th>{t("common.date")}</th></tr></thead>
              <tbody>{vendors.map(v=>(
                <tr key={v.id} style={{ cursor:"pointer",background:selected?.id===v.id?"var(--primary-light)":"white" }} onClick={()=>setSelected(selected?.id===v.id?null:v)}>
                  <td style={{ fontWeight:600 }}>{v.name}</td>
                  <td style={{ color:"var(--muted)" }}>{new Date(v.created_at).toLocaleDateString()}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
        <div className="card" style={{ padding:20 }}>
          {!selected ? <div style={{ padding:24,color:"var(--muted)",textAlign:"center" }}>👈 Select a vendor</div> : (
            <>
              <div style={{ fontWeight:700,fontSize:16,marginBottom:12 }}>{selected.name}</div>
              <RecordNotes entityType="vendor" entityId={selected.id} authorName="ERP User" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}