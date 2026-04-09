import { useEffect, useMemo, useState } from "react";
import { createInventoryMovement, listInventoryMovements, listProducts } from "../lib/erpApi";
import type { InventoryMovementRow, ProductRow } from "../lib/erpApi";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

export default function StockMovements() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [movements, setMovements] = useState<InventoryMovementRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [productId, setProductId] = useState("");
  const [reason, setReason] = useState<"receive" | "adjust">("receive");
  const [qtyDelta, setQtyDelta] = useState<number>(1);
  const [note, setNote] = useState("");

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId) ?? null,
    [products, productId]
  );

  async function refresh() {
    setLoading(true);
    try {
      const [ps, ms] = await Promise.all([
        listProducts(),
        listInventoryMovements({ limit: 200 }),
      ]);
      setProducts(ps);
      setMovements(ms);
    } catch (e: any) {
      alert(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function submit() {
    if (!productId) return alert("Pick a product.");
    if (!Number.isFinite(qtyDelta) || qtyDelta === 0) return alert("Qty change must be non-zero.");

    // For receive, force positive; for adjust, allow +/-.
    const finalDelta = reason === "receive" ? Math.abs(Number(qtyDelta)) : Number(qtyDelta);

    try {
      await createInventoryMovement({
        product_id: productId,
        qty_delta: finalDelta,
        reason: reason === "receive" ? "receive" : "adjust",
        note: note.trim() ? note.trim() : undefined,
      });

      setQtyDelta(1);
      setNote("");
      await refresh();
      alert("Stock updated.");
    } catch (e: any) {
      alert(e.message ?? String(e));
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <h1 className="pageTitle">Stock movements</h1>
          <div className="pageSub">Receive or adjust inventory and keep a history.</div>
        </div>
        <button className="btn" onClick={refresh}>{loading ? "Loading..." : "Refresh"}</button>
      </div>

      <section className="card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>New movement</div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 2fr auto", gap: 10, alignItems: "end" }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Product</div>
            <select className="input" value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">Select product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name} (Stock: {p.stock})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Type</div>
            <select className="input" value={reason} onChange={(e) => setReason(e.target.value as any)}>
              <option value="receive">Receive (+)</option>
              <option value="adjust">Adjust (+/-)</option>
            </select>
          </div>

          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Qty change</div>
            <input className="input" type="number" value={qtyDelta} onChange={(e) => setQtyDelta(Number(e.target.value))} />
          </div>

          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Note</div>
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note..." />
          </div>

          <button className="btn btnPrimary" onClick={submit}>Save</button>
        </div>

        {selectedProduct && (
          <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 12 }}>
            Selected: <b>{selectedProduct.sku}</b> — {selectedProduct.name} • Current stock: {fmt(Number(selectedProduct.stock))}
          </div>
        )}
      </section>

      <section className="card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Recent movements</div>

        {loading ? (
          <div style={{ color: "var(--muted)" }}>Loading...</div>
        ) : movements.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>No movements yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Product</th>
                  <th>Reason</th>
                  <th>Qty change</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const p = products.find((x) => x.id === m.product_id);
                  return (
                    <tr key={m.id}>
                      <td>{new Date(m.created_at).toLocaleString()}</td>
                      <td>{p ? `${p.sku} — ${p.name}` : m.product_id.slice(0, 8) + "..."}</td>
                      <td>{m.reason}</td>
                      <td style={{ fontWeight: 800, color: Number(m.qty_delta) >= 0 ? "#166534" : "#b91c1c" }}>
                        {Number(m.qty_delta) >= 0 ? "+" : ""}{fmt(Number(m.qty_delta))}
                      </td>
                      <td>{m.note ?? ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
