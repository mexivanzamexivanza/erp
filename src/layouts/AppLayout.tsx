import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useTranslation } from "react-i18next";
import NotificationBell from "../components/NotificationBell";
import GlobalSearch from "../components/GlobalSearch";
import { syncCalendarFromERP } from "../lib/erpApi";

function SideLink({ to, icon, label, badge }: { to: string; icon: string; label: string; badge?: number }) {
  return (
    <NavLink to={to} className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}>
      <span style={{ fontSize: 15 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge != null && badge > 0 && (
        <span style={{ background: "#dc2626", color: "white", borderRadius: 10, fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{badge}</span>
      )}
    </NavLink>
  );
}
function Group({ label }: { label: string }) {
  return <div className="sidebar-group-label">{label}</div>;
}

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "??";

  async function doLogout() { await signOut(); navigate("/login"); }

  function toggleLanguage() {
    const next = i18n.language === "es" ? "en" : "es";
    i18n.changeLanguage(next);
    localStorage.setItem("erp_language", next);
  }

  const syncDone = { current: false };
  if (!syncDone.current) {
    syncDone.current = true;
    syncCalendarFromERP().catch(() => {});
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⚡</div>
          <div>
            <div className="sidebar-logo-text">ERP System</div>
            <div className="sidebar-logo-sub">Enterprise Edition</div>
          </div>
        </div>
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-email">{user?.email ?? "Signed out"}</div>
        </div>
        <nav className="sidebar-nav">
          <Group label={t("nav.overview")} />
          <SideLink to="/app/dashboard"         icon="📊" label={t("nav.dashboard")} />
          <SideLink to="/app/calendar"          icon="📅" label={t("calendar.title")} />
          <SideLink to="/app/messages"          icon="💬" label="Mensajes" />

          <Group label={t("nav.finance")} />
          <SideLink to="/app/financial-reports" icon="📑" label={t("reports.title")} />
          <SideLink to="/app/general-ledger"    icon="📒" label={t("nav.generalLedger")} />
          <SideLink to="/app/invoices"          icon="🧾" label={t("nav.invoices")} />
          <SideLink to="/app/bills"             icon="📄" label={t("nav.bills")} />
          <SideLink to="/app/ar-aging"          icon="📈" label={t("nav.arAging")} />
          <SideLink to="/app/ap-aging"          icon="📉" label={t("nav.apAging")} />

          <Group label={t("nav.hr")} />
          <SideLink to="/app/employees"         icon="👥" label={t("nav.employees")} />
          <SideLink to="/app/payroll"           icon="💸" label={t("nav.payroll")} />

          <Group label={t("nav.sales")} />
          <SideLink to="/app/crm"               icon="📣" label={t("crm.title")} />
          <SideLink to="/app/sales"             icon="🛒" label={t("nav.salesOrders")} />
          <SideLink to="/app/customers"         icon="🤝" label={t("nav.customers")} />

          <Group label={t("nav.inventory")} />
          <SideLink to="/app/inventory"         icon="📦" label={t("nav.inventory")} />
          <SideLink to="/app/stock-movements"   icon="🔄" label={t("nav.stockMovements")} />

          <Group label={t("nav.procurement")} />
          <SideLink to="/app/vendors"           icon="🏭" label={t("nav.vendors")} />
          <SideLink to="/app/purchase-orders"   icon="📋" label={t("nav.purchaseOrders")} />
          <SideLink to="/app/receiving"         icon="📥" label={t("nav.receiving")} />

          <Group label={t("manufacturing.title")} />
          <SideLink to="/app/manufacturing"     icon="🏗️"  label={t("manufacturing.title")} />
          <SideLink to="/app/projects"          icon="📌" label={t("projects.title")} />
          <SideLink to="/app/logistics"         icon="🚚" label={t("logistics.title")} />

          <Group label={t("nav.system")} />
          <SideLink to="/app/currency"          icon="💱" label={t("currency.pageTitle")} />
          <SideLink to="/app/user-roles"        icon="👑" label={t("roles.title")} />
          <SideLink to="/app/audit-log"         icon="🔍" label={t("nav.auditLog")} />
          <SideLink to="/app/settings"          icon="⚙️"  label={t("nav.settings")} />
          <SideLink to="/pricing"           icon="💰" label="Planes y Precios" />
        </nav>
        <div className="sidebar-footer">
          <button onClick={toggleLanguage} className="btn"
            style={{ width: "100%", justifyContent: "center", marginBottom: 8, fontSize: 12 }}>
            {i18n.language === "es" ? "🇺🇸 English" : "🇲🇽 Español"}
          </button>
          <button className="btn btnDanger" onClick={doLogout}
            style={{ width: "100%", justifyContent: "center" }}>
            🚪 {t("nav.logout")}
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-title">ERP System</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <GlobalSearch />
            <NotificationBell />
            <span className="badge badge-primary" style={{ fontSize: 11 }}>● Live</span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{user?.email}</span>
          </div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}