import { NavLink, Outlet } from "react-router-dom";

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  display: "block",
  padding: "10px 12px",
  borderRadius: 8,
  textDecoration: "none",
  color: isActive ? "white" : "#111",
  background: isActive ? "#111" : "transparent",
});

export default function AppLayout() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: "100vh" }}>
      <aside style={{ padding: 16, borderRight: "1px solid #eee" }}>
        <div style={{ fontWeight: 800, marginBottom: 12 }}>ERP</div>
        <nav style={{ display: "grid", gap: 6 }}>
          <NavLink to="/dashboard" style={linkStyle}>Dashboard</NavLink>
          <NavLink to="/customers" style={linkStyle}>Customers</NavLink>
          <NavLink to="/inventory" style={linkStyle}>Inventory</NavLink>
          <NavLink to="/sales" style={linkStyle}>Sales</NavLink>
        </nav>
      </aside>

      <main style={{ padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}
