import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";

type RoleRow = { id: string; email: string; role: string; created_at: string };
type PendingUser = { id: string; email: string; created_at: string };

const ROLES = ["admin", "manager", "employee"] as const;
const ROLE_ICONS: Record<string, string> = { admin: "\uD83D\uDC51", manager: "\uD83D\uDCBC", employee: "\uD83D\uDC64" };
const ROLE_COLORS: Record<string, string> = { admin: "#dc2626", manager: "#d97706", employee: "#2563eb" };
const ROLE_DESC: Record<string, string> = {
  admin:    "Full access to all modules",
  manager:  "Access to most modules, cannot manage roles",
  employee: "Limited access. Read-only on finance.",
};

export default function UserRoles() {
  const { t } = useTranslation();
  const [roles, setRoles]           = useState<RoleRow[]>([]);
  const [_pending, _setPending]       = useState<PendingUser[]>([]);
  const [loading, setLoading]       = useState(true);
  const [email, setEmail]           = useState("");
  const [role, setRole]             = useState<string>("employee");
  const [saving, setSaving]         = useState(false);
  const [myEmail, setMyEmail]       = useState("");
  const [myRole, setMyRole]         = useState("employee");
  const [tab, setTab]               = useState<"roles"|"pending">("roles");
  const [search, setSearch]         = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const em = data.user?.email ?? "";
      setMyEmail(em);
      // Load role immediately after getting email
      if (em) {
        supabase.from("user_roles").select("role").eq("email", em).single()
          .then(({ data: rd }) => { if (rd?.role) setMyRole(rd.role); });
      }
    });
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      // Load assigned roles
      const { data: roleData, error: roleErr } = await supabase
        .from("user_roles").select("*").order("created_at", { ascending: false });
      if (roleErr) throw new Error(roleErr.message);
      setRoles(roleData ?? []);

      // Find my role
      const me = (roleData ?? []).find((r: RoleRow) => r.email === myEmail);
      if (me) setMyRole(me.role);

      // Load all auth users to find pending (no role assigned)
      // We use a workaround: list users via supabase admin or just show "invite" flow
      _setPending([]);
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  }

  async function assignRole() {
    if (!email.trim()) return alert("Email is required");
    if (!/\S+@\S+\.\S+/.test(email)) return alert("Enter a valid email");
    setSaving(true);
    try {
      const { error } = await supabase.from("user_roles")
        .upsert({ email: email.trim().toLowerCase(), role }, { onConflict: "email" });
      if (error) throw new Error(error.message);
      setEmail("");
      setRole("employee");
      await load();
      alert(`Role "${role}" assigned to ${email}`);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function changeRole(id: string, newRole: string) {
    try {
      const { error } = await supabase.from("user_roles").update({ role: newRole }).eq("id", id);
      if (error) throw new Error(error.message);
      await load();
    } catch (e: any) { alert(e.message); }
  }

  async function removeRole(id: string, rowEmail: string) {
    if (!confirm(`Remove role for ${rowEmail}?`)) return;
    try {
      const { error } = await supabase.from("user_roles").delete().eq("id", id);
      if (error) throw new Error(error.message);
      await load();
    } catch (e: any) { alert(e.message); }
  }

  const filtered = roles.filter(r => r.email.toLowerCase().includes(search.toLowerCase()));
  const counts = { admin: roles.filter(r=>r.role==="admin").length, manager: roles.filter(r=>r.role==="manager").length, employee: roles.filter(r=>r.role==="employee").length };

  const tabSt = (v: string) => ({
    padding:"8px 20px", borderRadius:8, fontWeight:600, fontSize:13, cursor:"pointer",
    border:"1px solid "+(tab===v?"var(--primary)":"var(--border)"),
    background:tab===v?"var(--primary)":"white", color:tab===v?"white":"var(--text)"
  });

  return (
    <div style={{ display:"grid", gap:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <h1 className="pageTitle">{t("roles.title")}</h1>
          <div className="pageSub">Manage who can access what in the system</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:13, color:"var(--muted)" }}>Your role:</span>
          <span style={{ background:ROLE_COLORS[myRole]+"20", color:ROLE_COLORS[myRole], border:"1px solid "+ROLE_COLORS[myRole]+"40", borderRadius:8, padding:"4px 12px", fontWeight:700, fontSize:13 }}>
            {ROLE_ICONS[myRole]} {myRole.toUpperCase()}
          </span>
          <button className="btn" onClick={load}>&#128260;</button>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {ROLES.map(r => (
          <div key={r} className="kpi-card" style={{ borderTop:"3px solid "+ROLE_COLORS[r] }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div className="kpi-label" style={{ textTransform:"uppercase", letterSpacing:1 }}>{r}</div>
              <span style={{ fontSize:24 }}>{ROLE_ICONS[r]}</span>
            </div>
            <div className="kpi-value" style={{ color:ROLE_COLORS[r], fontSize:32, margin:"8px 0" }}>{counts[r]}</div>
            <div style={{ fontSize:12, color:"var(--muted)" }}>{ROLE_DESC[r]}</div>
          </div>
        ))}
      </div>

      {/* Assign new role */}
      <div className="card" style={{ padding:20 }}>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>&#10133; Assign Role to User</div>
        <div style={{ fontSize:13, color:"var(--muted)", marginBottom:14 }}>
          Enter the user's email. They must already have a Supabase account (signed up via the login page).
          After assigning, they can log in with their role active.
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 200px auto", gap:10, alignItems:"end" }}>
          <div>
            <div style={{ fontSize:12, color:"var(--muted)", marginBottom:4 }}>User Email *</div>
            <input className="input" type="email" placeholder="user@company.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && assignRole()} />
          </div>
          <div>
            <div style={{ fontSize:12, color:"var(--muted)", marginBottom:4 }}>Role *</div>
            <select className="input" value={role} onChange={e => setRole(e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_ICONS[r]} {r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
            </select>
          </div>
          <button className="btn btnPrimary" onClick={assignRole} disabled={saving} style={{ height:40 }}>
            {saving ? "Saving..." : "Assign Role"}
          </button>
        </div>

        {/* Role descriptions */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginTop:16 }}>
          {ROLES.map(r => (
            <div key={r} style={{ background:ROLE_COLORS[r]+"08", border:"1px solid "+ROLE_COLORS[r]+"30", borderRadius:10, padding:12 }}>
              <div style={{ fontWeight:700, color:ROLE_COLORS[r], marginBottom:4 }}>{ROLE_ICONS[r]} {r.charAt(0).toUpperCase()+r.slice(1)}</div>
              <div style={{ fontSize:12, color:"var(--muted)" }}>{ROLE_DESC[r]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How to sign up info box */}
      <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:12, padding:16, display:"flex", gap:12 }}>
        <span style={{ fontSize:24, flexShrink:0 }}>&#128161;</span>
        <div>
          <div style={{ fontWeight:700, marginBottom:4, color:"#1e40af" }}>How do employees sign up?</div>
          <ol style={{ fontSize:13, color:"#1e3a8a", margin:0, paddingLeft:20, lineHeight:2 }}>
            <li>Employee goes to <strong>your app URL /login</strong> and clicks <strong>"Create account"</strong></li>
            <li>They sign up with their work email</li>
            <li>Admin comes here and assigns their role (employee / manager / admin)</li>
            <li>Employee refreshes — their role is active immediately</li>
          </ol>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8 }}>
        <button style={tabSt("roles")}   onClick={()=>setTab("roles")}>
          &#128081; All Roles ({roles.length})
        </button>
      </div>

      {/* Roles table */}
      <div className="card">
        <div style={{ padding:"14px 16px", borderBottom:"1px solid var(--border)", display:"flex", gap:10, alignItems:"center" }}>
          <input className="input" style={{ flex:1 }} placeholder="&#128269; Search by email..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <span style={{ fontSize:13, color:"var(--muted)", flexShrink:0 }}>{filtered.length} users</span>
        </div>

        {loading ? (
          <div style={{ padding:24, color:"var(--muted)", textAlign:"center" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:32, textAlign:"center", color:"var(--muted)" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>&#128081;</div>
            <div style={{ fontWeight:600 }}>No users assigned yet</div>
            <div style={{ fontSize:13, marginTop:4 }}>Use the form above to assign roles</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Assigned</th>
                <th>Change Role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} style={{ background: r.email === myEmail ? "#eff6ff" : "white" }}>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:32, height:32, borderRadius:"50%", background:ROLE_COLORS[r.role]+"20", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:12, color:ROLE_COLORS[r.role] }}>
                        {r.email.slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:13 }}>{r.email}</div>
                        {r.email === myEmail && <div style={{ fontSize:11, color:"var(--primary)" }}>&#9679; You</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ background:ROLE_COLORS[r.role]+"20", color:ROLE_COLORS[r.role], border:"1px solid "+ROLE_COLORS[r.role]+"40", borderRadius:8, padding:"3px 10px", fontWeight:700, fontSize:12 }}>
                      {ROLE_ICONS[r.role]} {r.role}
                    </span>
                  </td>
                  <td style={{ color:"var(--muted)", fontSize:12 }}>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td>
                    <select
                      value={r.role}
                      onChange={e => changeRole(r.id, e.target.value)}
                      disabled={r.email === myEmail}
                      style={{ padding:"4px 8px", borderRadius:6, border:"1px solid var(--border)", fontSize:12, cursor:"pointer" }}>
                      {ROLES.map(ro => <option key={ro} value={ro}>{ROLE_ICONS[ro]} {ro}</option>)}
                    </select>
                  </td>
                  <td>
                    <button
                      className="btn btnDanger"
                      style={{ padding:"4px 10px", fontSize:12 }}
                      disabled={r.email === myEmail}
                      onClick={() => removeRole(r.id, r.email)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}