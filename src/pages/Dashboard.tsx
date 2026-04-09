import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Kpi = { label: string; value: string; hint?: string };

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  const [customersCount, setCustomersCount] = useState(0);
  const [productsCount, setProductsCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [ordersTodayCount, setOrdersTodayCount] = useState(0);
  const [salesTodayTotal, setSalesTodayTotal] = useState(0);

  async function refresh() {
    setLoading(true);
    try {
      const customers = await supabase.from("customers").select("id", { count: "exact", head: true });
      if (customers.error) throw customers.error;

      const products = await supabase.from("products").select("id", { count: "exact", head: true });
      if (products.error) throw products.error;

      const lowStock = await supabase.from("products").select("id", { count: "exact", head: true }).lte("stock", 5);
      if (lowStock.error) throw lowStock.error;

      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const ordersToday = await supabase
        .from("sales_orders")
        .select("id, created_at", { count: "exact" })
        .gte("created_at", start.toISOString());

      if (ordersToday.error) throw ordersToday.error;

      const orderIds = (ordersToday.data ?? []).map((o) => o.id);
      let total = 0;

      if (orderIds.length > 0) {
        const lines = await supabase
          .from("sales_order_lines")
          .select("qty, price, sales_order_id")
          .in("sales_order_id", orderIds);

        if (lines.error) throw lines.error;

        total = (lines.data ?? []).reduce((sum, l) => sum + Number(l.qty) * Number(l.price), 0);
      }

      setCustomersCount(customers.count ?? 0);
      setProductsCount(products.count ?? 0);
      setLowStockCount(lowStock.count ?? 0);
      setOrdersTodayCount(ordersToday.count ?? 0);
      setSalesTodayTotal(total);
    } catch (e: any) {
      alert(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const kpis: Kpi[] = useMemo(
    () => [
      { label: "Customers", value: String(customersCount) },
      { label: "Products", value: String(productsCount) },
      { label: "Low stock (≤ 5)", value: String(lowStockCount), hint: "Review reorders" },
      { label: "Orders today", value: String(ordersTodayCount) },
      { label: "Sales today", value: money(salesTodayTotal) },
    ],
    [customersCount, productsCount, lowStockCount, ordersTodayCount, salesTodayTotal]
  );

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <h1 className="pageTitle">Dashboard</h1>
          <div className="pageSub">Live KPIs from Supabase.</div>
        </div>
        <button className="btn btnPrimary" onClick={refresh} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        {kpis.map((k) => (
          <div key={k.label} className="card" style={{ padding: 14 }}>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 850, marginTop: 8 }}>{k.value}</div>
            {k.hint ? <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 6 }}>{k.hint}</div> : null}
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Quick start</div>
        <ol style={{ margin: 0, paddingLeft: 18, color: "#374151" }}>
          <li>Add customers</li>
          <li>Add products + stock</li>
          <li>Create a sales order</li>
          <li>Return here and refresh</li>
        </ol>
      </div>
    </div>
  );
}
