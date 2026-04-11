import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getDashboardChartData, getStockChartData } from "../lib/erpApi";

function money(n: number) { return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }

export default function DashboardCharts() {
  const { t } = useTranslation();
  const [monthData, setMonthData] = useState<any[]>([]);
  const [stockData, setStockData] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [md, sd] = await Promise.all([getDashboardChartData(), getStockChartData()]);
        setMonthData(md); setStockData(sd);
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>📊 {t("common.loading")}</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>📈 {t("reports.revenue")} vs {t("reports.cogs")} (6 {t("calendar.types.general")})</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => "$" + (v >= 1000 ? (v/1000).toFixed(0) + "k" : v)} />
            <Tooltip formatter={(v: any) => money(v)} />
            <Legend />
            <Area type="monotone" dataKey="revenue" name={t("reports.revenue")} stroke="#2563eb" fill="url(#colorRev)" strokeWidth={2} />
            <Area type="monotone" dataKey="expenses" name={t("reports.cogs")} stroke="#dc2626" fill="url(#colorExp)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>🛒 {t("dashboard.ordersToday")} / {t("nav.overview")}</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="orders" name={t("nav.salesOrders")} fill="#2563eb" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {stockData.length > 0 && (
        <div className="card" style={{ padding: 20, gridColumn: "1/-1" }}>
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>📦 {t("nav.inventory")} — {t("dashboard.lowStock")}</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stockData} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="stock" name={t("inventory.stock")} fill="#16a34a" radius={[0,4,4,0]}
                label={{ position: "right", fontSize: 11, fill: "#64748b" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}