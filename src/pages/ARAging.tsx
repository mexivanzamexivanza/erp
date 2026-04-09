import { useEffect, useMemo, useState } from "react";
import { listARAging } from "../lib/erpApi";
import type { ARAgingRow } from "../lib/erpApi";

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0));
}

export default function ARAging() {
  const [rows, setRows] = useState<ARAgingRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      setRows(await listARAging());
    } catch (e: any) {
      alert(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const openOnly = useMemo(() => rows.filter((r) => r.status === "open" && Number(r.balance_due) > 0), [rows]);

  const totals = useMemo(() => {
    const buckets = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
    for (const r of openOnly) {
      const b = r.bucket as keyof typeof buckets;
      if (b in buckets) buckets[b] += Number(r.balance_due);
    }
    return buckets;
  }, [openOnly]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <h1 className="pageTitle">AR aging</h1>
          <div className="pageSub">Open invoice balances grouped by days past due.</div>
        </div>
        <button className="btn" onClick={refresh}>{loading ? "Loading..." : "Refresh"}</button>
      </div>

      <section className="card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Totals (open only)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          <div className="card" style={{ padding: 12 }}><div style={{ color: "var(--muted)", fontSize: 12 }}>0–30</div><div style={{ fontWeight: 900 }}>{money(totals["0-30"])}</div></div>
          <div className="card" style={{ padding: 12 }}><div style={{ color: "var(--muted)", fontSize: 12 }}>31–60</div><div style={{ fontWeight: 900 }}>{money(totals["31-60"])}</div></div>
          <div className="card" style={{ padding: 12 }}><div style={{ color: "var(--muted)", fontSize: 12 }}>61–90</div><div style={{ fontWeight: 900 }}>{money(totals["61-90"])}</div></div>
          <div className="card" style={{ padding: 12 }}><div style={{ color: "var(--muted)", fontSize: 12 }}>90+</div><div style={{ fontWeight: 900 }}>{money(totals["90+"])}</div></div>
        </div>
      </section>

      <section className="card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Invoices (open only)</div>

        {loading ? (
          <div style={{ color: "var(--muted)" }}>Loading...</div>
        ) : openOnly.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>No open balances.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Bucket</th>
                  <th>Days past due</th>
                  <th>Issued</th>
                  <th>Due</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {openOnly.map((r) => (
                  <tr key={r.invoice_id}>
                    <td>{r.customer_name}</td>
                    <td style={{ fontWeight: 800 }}>{r.bucket}</td>
                    <td>{r.days_past_due}</td>
                    <td>{new Date(r.issued_at).toLocaleDateString()}</td>
                    <td>{r.due_at ? new Date(r.due_at).toLocaleDateString() : ""}</td>
                    <td>{money(r.total)}</td>
                    <td>{money(r.amount_paid)}</td>
                    <td style={{ fontWeight: 900 }}>{money(r.balance_due)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
