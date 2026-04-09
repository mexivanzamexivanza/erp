import { useMemo, useEffect, useState } from "react";
import { createProduct, listProducts } from "../lib/erpApi";
import type { ProductRow } from "../lib/erpApi";

export default function Inventory() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);

  async function refresh() {
    setLoading(true);
    try {
      const rows = await listProducts();
      setProducts(rows);
    } catch (e: any) {
      alert(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return products;
    return products.filter((p) => [p.sku, p.name].some((v) => v.toLowerCase().includes(s)));
  }, [products, q]);

  async function addProduct() {
    if (!sku.trim() || !name.trim()) return alert("SKU and name required.");
    if (price < 0) return alert("Price cannot be negative");

    try {
      await createProduct({ sku: sku.trim(), name: name.trim(), price: Number(price), stock: Number(stock) });
      setSku(""); setName(""); setPrice(0); setStock(0);
      await refresh();
    } catch (e: any) {
      alert(e.message ?? String(e));
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <h1 className="pageTitle">Inventory</h1>
          <div className="pageSub">Backed by Supabase Postgres.</div>
        </div>
        <div className="badge">Items: {products.length}</div>
      </div>

      <section className="card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Add product</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>SKU</div>
            <input className="input" value={sku} onChange={(e) => setSku(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Name</div>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Price</div>
            <input className="input" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Stock</div>
            <input className="input" type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} />
          </div>
          <button className="btn btnPrimary" onClick={addProduct}>Add</button>
        </div>
      </section>

      <section className="card" style={{ padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
          <div style={{ fontWeight: 800 }}>Products</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input className="input" style={{ width: 280 }} placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn" onClick={refresh}>Refresh</button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          {loading ? (
            <div style={{ color: "var(--muted)" }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ color: "var(--muted)" }}>No products found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td>{p.sku}</td>
                      <td>{p.name}</td>
                      <td>${Number(p.price).toFixed(2)}</td>
                      <td>{p.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
