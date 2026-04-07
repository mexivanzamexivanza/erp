import { useMemo, useState } from "react";
import { loadProducts, saveProducts, uid } from "../lib/productsStore";
import type { Product } from "../lib/productsStore";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e5e5e5",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #111",
  background: "#111",
  color: "white",
  cursor: "pointer",
};

const buttonGhost: React.CSSProperties = {
  ...buttonStyle,
  background: "transparent",
  color: "#111",
};

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  const [q, setQ] = useState("");

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return products;
    return products.filter((p) => [p.sku, p.name].some((v) => v.toLowerCase().includes(s)));
  }, [products, q]);

  function addProduct() {
    if (!sku.trim() || !name.trim()) return alert("SKU and name required.");
    if (price < 0) return alert("Price cannot be negative");
    const p: Product = { id: uid("prod"), sku: sku.trim(), name: name.trim(), price: Number(price), stock: Number(stock) };
    const next = [p, ...products];
    setProducts(next);
    saveProducts(next);
    setSku(""); setName(""); setPrice(0); setStock(0);
  }

  function removeProduct(id: string) {
    if (!confirm("Delete product?")) return;
    const next = products.filter((p) => p.id !== id);
    setProducts(next);
    saveProducts(next);
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <h1 style={{ margin: 0 }}>Inventory</h1>
          <div style={{ color: "#666", marginTop: 6 }}>Products list (LocalStorage).</div>
        </div>
        <div style={{ color: "#666" }}>Items: {products.length}</div>
      </div>

      <section style={{ border: "1px solid #eee", borderRadius: 14, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Add product</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 12, color: "#555" }}>SKU</label>
            <input style={inputStyle} value={sku} onChange={(e) => setSku(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#555" }}>Name</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#555" }}>Price</label>
            <input type="number" style={inputStyle} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#555" }}>Stock</label>
            <input type="number" style={inputStyle} value={stock} onChange={(e) => setStock(Number(e.target.value))} />
          </div>
          <button style={buttonStyle} onClick={addProduct}>Add</button>
        </div>
      </section>

      <section style={{ border: "1px solid #eee", borderRadius: 14, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
          <h2 style={{ marginTop: 0 }}>Products</h2>
          <input style={{ ...inputStyle, maxWidth: 320 }} placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {filtered.length === 0 ? (
          <div style={{ color: "#666" }}>No products found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>SKU</th>
                  <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>Name</th>
                  <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>Price</th>
                  <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>Stock</th>
                  <th style={{ padding: 10, borderBottom: "1px solid #eee" }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }}>{p.sku}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }}>{p.name}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }}>${p.price.toFixed(2)}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }}>{p.stock}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }}>
                      <button style={buttonGhost} onClick={() => removeProduct(p.id)}>Delete</button>
                    </td>
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
