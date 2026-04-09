import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

const navItem = ({ isActive }: { isActive: boolean }) => ({
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 10,
  color: isActive ? "#111827" : "#374151",
  background: isActive ? "#eef2ff" : "transparent",
  border: "1px solid " + (isActive ? "#c7d2fe" : "transparent"),
  fontWeight: isActive ? 700 : 600,
});

function Icon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function doLogout() {
    await signOut();
    navigate("/login");
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "260px 1fr" }}>
      <aside style={{ background: "white", borderRight: "1px solid var(--border)", padding: 14 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 900, letterSpacing: 0.2 }}>ERP</div>
            <span className="badge">Sales + Inventory</span>
          </div>

          <div style={{ fontSize: 12, color: "var(--muted)", wordBreak: "break-word" }}>
            {user?.email ?? "Signed out"}
          </div>

          <nav style={{ display: "grid", gap: 6, marginTop: 8 }}>
            <NavLink to="/dashboard" style={navItem}>
              <Icon d="M3 13h8V3H3v10zM13 21h8V11h-8v10zM13 3h8v6h-8V3zM3 21h8v-6H3v6z" />
              Dashboard
            </NavLink>
            <NavLink to="/customers" style={navItem}>
              <Icon d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              Customers
            </NavLink>
            <NavLink to="/inventory" style={navItem}>
              <Icon d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              Inventory
            </NavLink>
            
            <NavLink to="/stock-movements" style={navItem}>
              <Icon d="M3 3v18h18M7 14l3 3 7-7" />
              Stock movements
            </NavLink>
<NavLink to="/sales" style={navItem}>
              <Icon d="M7 13h10l4-8H5.4" />
              Sales
            </NavLink>
            <NavLink to="/invoices" style={navItem}>
              <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" />
              Invoices
            </NavLink>
            <NavLink to="/ar-aging" style={navItem}>
              <Icon d="M3 3v18h18M7 13h3v5H7zM12 9h3v9h-3zM17 6h3v12h-3z" />
              AR aging
            </NavLink>
            <NavLink to="/audit-log" style={navItem}>
              <Icon d="M12 20h9M12 4h9M4 6h6M4 10h6M4 14h6M4 18h6" />
              Audit log
            </NavLink>
            <NavLink to="/vendors" style={navItem}>
              <Icon d="M20 7h-9M20 11h-9M20 15h-9M4 7h.01M4 11h.01M4 15h.01" />
              Vendors
            </NavLink>
            <NavLink to="/bills" style={navItem}>
              <Icon d="M6 2h9l3 3v17H6zM9 7h6M9 11h6M9 15h6" />
              Bills
            </NavLink>
            <NavLink to="/ap-aging" style={navItem}>
              <Icon d="M3 3v18h18M7 13h3v5H7zM12 9h3v9h-3zM17 6h3v12h-3z" />
              AP aging
            </NavLink>
            <NavLink to="/purchase-orders" style={navItem}>
              <Icon d="M9 11h6M9 15h6M7 3h10a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2z" />
              Purchase orders
            </NavLink>
            <NavLink to="/receiving" style={navItem}>
              <Icon d="M20 6H9l-2 2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z" />
              Receiving
            </NavLink>
          </nav>

          <hr className="sep" />

          <button className="btn btnDanger" onClick={doLogout} style={{ width: "100%" }}>
            Logout
          </button>
        </div>
      </aside>

      <div style={{ display: "grid", gridTemplateRows: "56px 1fr" }}>
        <header style={{ background: "white", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center" }}>
          <div className="container" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 800 }}>ERP</div>
            <span className="badge">Supabase</span>
          </div>
        </header>

        <main style={{ padding: 18 }}>
          <div className="container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}







