import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { listCustomers, createCustomer, deleteCustomer } from "../lib/erpApi";
import type { CustomerRow } from "../lib/erpApi";
import RecordNotes from "../components/RecordNotes";

export default function Customers() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<CustomerRow | null>(null);
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try { setCustomers(await listCustomers()); } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function handleAdd() {
    if (!name.trim()) return alert(t("customers.nameRequired"));
    setSaving(true);
    try { await createCustomer({ name, email: email||undefined, phone: phone||undefined }); setName(""); setEmail(""); setPhone(""); await load(); }
    catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }
  async function handleDelete(id: string) {
    if (!confirm(t("common.confirm"))) return;
    try { await deleteCustomer(id); if (selected?.id === id) setSelected(null); await load(); } catch (e: any) { alert(e.message); }
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1 className="pageTitle">{t("customers.title")}</h1><div className="pageSub">{t("customers.subtitle")}</div></div>
      </div>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>{t("customers.addCustomer")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
          <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("common.name")} *</div><input className="input" value={name} onChange={e => setName(e.target.value)} /></div>
          <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("common.email")}</div><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("common.phone")}</div><input className="input" value={phone} onChange={e => setPhone(e.target.value)} /></div>
          <button className="btn btnPrimary" onClick={handleAdd} disabled={saving}>{saving ? t("common.saving") : t("customers.addCustomer")}</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 16, alignItems: "start" }}>
        <div className="card">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>{t("customers.list")} ({customers.length})</div>
          {loading ? <div style={{ padding: 20, color: "var(--muted)" }}>{t("common.loading")}</div> :
           customers.length === 0 ? <div style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>{t("common.noData")}</div> : (
            <table className="table">
              <thead><tr><th>{t("common.name")}</th><th>{t("common.email")}</th><th>{t("common.phone")}</th><th></th></tr></thead>
              <tbody>{customers.map(c => (
                <tr key={c.id} style={{ cursor:"pointer", background: selected?.id===c.id?"var(--primary-light)":"white" }} onClick={() => setSelected(selected?.id===c.id?null:c)}>
                  <td style={{ fontWeight:600 }}>{c.name}</td>
                  <td style={{ color:"var(--muted)" }}>{c.email??"—"}</td>
                  <td style={{ color:"var(--muted)" }}>{c.phone??"—"}</td>
                  <td><button className="btn btnDanger" style={{ padding:"4px 8px",fontSize:12 }} onClick={e=>{e.stopPropagation();handleDelete(c.id);}}>✕</button></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
        <div className="card" style={{ padding: 20 }}>
          {!selected ? <div style={{ padding:24,color:"var(--muted)",textAlign:"center" }}>👈 Select a customer</div> : (
            <>
              <div style={{ fontWeight:700,fontSize:16,marginBottom:4 }}>{selected.name}</div>
              <div style={{ fontSize:13,color:"var(--muted)",marginBottom:12 }}>{selected.email??""} {selected.phone?"· "+selected.phone:""}</div>
              <RecordNotes entityType="customer" entityId={selected.id} authorName="ERP User" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}