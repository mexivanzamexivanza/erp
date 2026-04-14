import RecordNotes from "../components/RecordNotes";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { listEmployees, createEmployee, deleteEmployee } from "../lib/erpApi";
import type { EmployeeRow } from "../lib/erpApi";
export default function Employees() {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<EmployeeRow | null>(null);
  const [name, setName]           = useState("");
  const [dept, setDept]           = useState("");
  const [position, setPosition]   = useState("");
  const [salary, setSalary]       = useState<number>(0);
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState("");

  async function load() {
    setLoading(true);
    try { setEmployees(await listEmployees()); } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function handleAdd() {
    if (!name.trim()) return alert(t("employees.nameRequired"));
    setSaving(true);
    try {
      await createEmployee({ name, department: dept || undefined, position: position || undefined, salary: salary || undefined, email: email || undefined, phone: phone || undefined });
      setName(""); setDept(""); setPosition(""); setSalary(0); setEmail(""); setPhone("");
      await load();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }
  async function handleDelete(id: string) {
    if (!confirm(t("common.confirm"))) return;
    try { await deleteEmployee(id); if (selected?.id === id) setSelected(null); await load(); }
    catch (e: any) { alert(e.message); }
  }

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.department ?? "").toLowerCase().includes(search.toLowerCase())
  );
  function money(n: number) { return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(n||0)); }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1 className="pageTitle">{t("employees.title")}</h1><div className="pageSub">{t("employees.subtitle")}</div></div>
        <div style={{ display: "flex", gap: 8 }}>
          <span className="badge badge-primary">{employees.filter(e => e.status === "active").length} {t("employees.active")}</span>
          <button className="btn" onClick={load}>🔄</button>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>{t("employees.addEmployee")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 10 }}>
          <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("common.name")} *</div><input className="input" value={name} onChange={e => setName(e.target.value)} /></div>
          <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("employees.department")}</div><input className="input" value={dept} onChange={e => setDept(e.target.value)} /></div>
          <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("employees.position")}</div><input className="input" value={position} onChange={e => setPosition(e.target.value)} /></div>
          <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("employees.salary")}</div><input className="input" type="number" value={salary} onChange={e => setSalary(Number(e.target.value))} /></div>
          <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("common.email")}</div><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("common.phone")}</div><input className="input" value={phone} onChange={e => setPhone(e.target.value)} /></div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btnPrimary" onClick={handleAdd} disabled={saving}>{saving ? t("common.saving") : t("employees.addEmployee")}</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 16, alignItems: "start" }}>
        <div className="card">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
            <input className="input" placeholder={"🔍 " + t("employees.search")} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {loading ? <div style={{ padding: 20, color: "var(--muted)" }}>{t("common.loading")}</div> :
           filtered.length === 0 ? <div style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>{t("common.noData")}</div> : (
            <table className="table">
              <thead><tr><th>{t("common.name")}</th><th>{t("employees.department")}</th><th>{t("employees.position")}</th><th>{t("employees.salary")}</th><th>{t("common.status")}</th><th></th></tr></thead>
              <tbody>{filtered.map(e => (
                <tr key={e.id} style={{ cursor: "pointer", background: selected?.id === e.id ? "var(--primary-light)" : "white" }}
                  onClick={() => setSelected(selected?.id === e.id ? null : e)}>
                  <td style={{ fontWeight: 600 }}>{e.name}</td>
                  <td style={{ color: "var(--muted)" }}>{e.department ?? "—"}</td>
                  <td style={{ color: "var(--muted)" }}>{e.position ?? "—"}</td>
                  <td style={{ fontWeight: 600 }}>{e.salary ? money(e.salary) : "—"}</td>
                  <td><span className={`badge ${e.status === "active" ? "badge-success" : "badge-danger"}`}>{e.status}</span></td>
                  <td><button className="btn btnDanger" style={{ padding: "4px 8px", fontSize: 12 }} onClick={ev => { ev.stopPropagation(); handleDelete(e.id); }}>✕</button></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>

        <div className="card" style={{ padding: 20 }}>
          {!selected ? (
            <div style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>👈 {t("employees.selectEmployee")}</div>
          ) : (
            <>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{selected.name}</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>{selected.position ?? ""} {selected.department ? "· " + selected.department : ""}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                <span className={`badge ${selected.status === "active" ? "badge-success" : "badge-danger"}`}>{selected.status}</span>
                {selected.salary && <span className="badge badge-primary">{money(selected.salary)}/mes</span>}
                {selected.email && <span className="badge">✉️ {selected.email}</span>}
              </div>
              <RecordNotes entityType="employee" entityId={selected.id} authorName="ERP User" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}