import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { listSalesOrders, generateSystemNotifications } from "../lib/erpApi";
import type { SalesOrderRow } from "../lib/erpApi";
import { supabase } from "../lib/supabaseClient";
import DashboardCharts from "../components/DashboardCharts";

function money(n: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0)); }

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ orders: 0, revenue: 0, customers: 0, products: 0, lowStock: 0, employees: 0, openInvoices: 0, unpaidBills: 0, overdueCount: 0 });
  const [todayOrders, setTodayOrders] = useState<SalesOrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const today = new Date().toISOString().slice(0, 10);
        const [customers, products, lowStock, employees, invoices, bills, orders, allOrders] = await Promise.all([
          supabase.from("customers").select("id", { count: "exact", head: true }),
          supabase.from("products").select("id", { count: "exact", head: true }),
          supabase.from("products").select("id", { count: "exact", head: true }).lte("stock", 5),
          supabase.from("employees").select("id", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("invoices").select("balance_due,due_at,status").in("status", ["draft","sent"]),
          supabase.from("bills").select("balance_due").in("status", ["draft","open"]),
          supabase.from("sales_orders").select("total").gte("created_at", today),
          listSalesOrders(),
        ]);
        const openInvoices = (invoices.data ?? []);
        const overdueCount = openInvoices.filter(i => i.due_at && new Date(i.due_at) < new Date()).length;
        const revenue = (orders.data ?? []).reduce((s: number, o: any) => s + Number(o.total || 0), 0);
        const unpaidBills = (bills.data ?? []).reduce((s: number, b: any) => s + Number(b.balance_due || 0), 0);
        setStats({ orders: orders.data?.length ?? 0, revenue, customers: customers.count ?? 0, products: products.count ?? 0, lowStock: lowStock.count ?? 0, employees: employees.count ?? 0, openInvoices: openInvoices.length, unpaidBills, overdueCount });
        setTodayOrders(allOrders.slice(0, 8));
        generateSystemNotifications().catch(() => {});
      } catch (e: any) { console.error(e); } finally { setLoading(false); }
    }
    load();
  }, []);

  const kpis = [
    { icon: "🛒", label: t("dashboard.ordersToday"),    value: stats.orders,                  color: "#2563eb", sub: t("dashboard.salesOrdersToday") },
    { icon: "💰", label: t("dashboard.revenueToday"),   value: money(stats.revenue),          color: "#16a34a", sub: t("dashboard.fromTodaysOrders") },
    { icon: "🤝", label: t("dashboard.customers"),      value: stats.customers,               color: "#7c3aed", sub: t("dashboard.totalCustomerAccounts") },
    { icon: "📦", label: t("dashboard.products"),       value: stats.products,                color: "#0891b2", sub: t("dashboard.activeSkus") },
    { icon: "⚠️", label: t("dashboard.lowStock"),       value: stats.lowStock,                color: "#d97706", sub: t("dashboard.itemsAtOrBelow5") },
    { icon: "👥", label: t("dashboard.activeEmployees"),value: stats.employees,               color: "#0891b2", sub: t("dashboard.currentHeadcount") },
    { icon: "🧾", label: t("dashboard.openInvoices"),   value: stats.openInvoices,            color: stats.overdueCount > 0 ? "#dc2626" : "#16a34a", sub: stats.overdueCount > 0 ? stats.overdueCount + " " + t("dashboard.overdue") : t("dashboard.allCurrent") },
    { icon: "📄", label: t("dashboard.unpaidBills"),    value: money(stats.unpaidBills),      color: stats.unpaidBills > 0 ? "#dc2626" : "#16a34a", sub: t("dashboard.billsAwaitingPayment") },
  ];

  const quickActions = [
    { icon: "🛒", label: t("dashboard.newSale"),            path: "/sales" },
    { icon: "📋", label: t("dashboard.newPurchaseOrder"),   path: "/purchase-orders" },
    { icon: "👥", label: t("dashboard.addEmployee"),        path: "/employees" },
    { icon: "🧾", label: t("dashboard.newInvoice"),         path: "/invoices" },
    { icon: "📦", label: t("dashboard.checkInventory"),     path: "/inventory" },
    { icon: "📅", label: t("calendar.title"),               path: "/calendar" },
    { icon: "💱", label: t("currency.title"),               path: "/currency" },
    { icon: "👑", label: t("roles.title"),                  path: "/user-roles" },
  ];

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1 className="pageTitle">{t("dashboard.title")}</h1>
        <div className="pageSub">{t("dashboard.subtitle")}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {kpis.map((k, i) => (
          <div key={i} className="kpi-card" style={{ borderTop: "3px solid " + k.color }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div className="kpi-label">{k.label}</div>
              <span style={{ fontSize: 22 }}>{k.icon}</span>
            </div>
            <div className="kpi-value" style={{ color: k.color, fontSize: 28, margin: "8px 0" }}>{loading ? "—" : k.value}</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <DashboardCharts />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 700 }}>{t("dashboard.recentOrders")}</div>
            <button className="btn" style={{ fontSize: 12 }} onClick={() => navigate("/sales")}>{t("dashboard.viewAll")} →</button>
          </div>
          {loading ? <div style={{ padding: 20, color: "var(--muted)" }}>{t("common.loading")}</div> :
           todayOrders.length === 0 ? <div style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>{t("dashboard.noOrdersToday")}</div> : (
            <table className="table">
              <thead><tr><th>{t("sales.customer")}</th><th>{t("common.status")}</th><th>{t("common.date")}</th></tr></thead>
              <tbody>{todayOrders.map(o => (
                <tr key={o.id} style={{ cursor: "pointer" }} onClick={() => navigate("/sales")}>
                  <td style={{ fontWeight: 600 }}>{o.customer_name}</td>
                  <td><span className={`badge ${o.status === "confirmed" ? "badge-success" : "badge-primary"}`}>{o.status}</span></td>
                  <td style={{ color: "var(--muted)", fontSize: 12 }}>{new Date(o.created_at).toLocaleString()}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 16 }}>⚡ {t("dashboard.quickActions")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {quickActions.map((a, i) => (
              <button key={i} onClick={() => navigate(a.path)} className="btn"
                style={{ justifyContent: "flex-start", gap: 8, padding: "10px 14px", fontSize: 13, textAlign: "left" }}>
                <span>{a.icon}</span>{a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}