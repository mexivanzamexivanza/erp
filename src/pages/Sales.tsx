import { useMemo, useState } from "react";
import { loadSales, money, saleTotal, saveSales, uid } from "../lib/salesStore";
import type { Sale, SaleLine } from "../lib/salesStore";

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

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>(() => loadSales());

  const [customerName, setCustomerName] = useState("");
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [qty, setQty] = useState<number>(1);
  const [price, setPrice] = useState<number>(0);

  const [draftLines, setDraftLines] = useState<SaleLine[]>([]);

  const draftTotal = useMemo(() => draftLines.reduce((s, l) => s + l.qty * l.price, 0), [draftLines]);

  function addLine() {
    if (!sku.trim() || !name.trim()) return alert("Enter SKU and Item name.");
    if (qty <= 0) return alert("Qty must be > 0");
    if (price < 0) return alert("Price cannot be negative");

    setDraftLines((prev) => [
      ...prev,
      { id: uid("line"), sku: sku.trim(), name: name.trim(), qty: Number(qty), price: Number(price) },
    ]);

    setSku("");
    setName("");
    setQty(1);
    setPrice(0);
  }

  function removeLine(id: string) {
    setDraftLines((prev) => prev.filter((l) => l.id !== id));
  }

  function createSale() {
    if (!customerName.trim()) return alert("Enter customer name.");
    if (draftLines.length === 0) return alert("Add at least one line item.");

    const sale: Sale = {
      id: uid("sale"),
      customerName: customerName.trim(),
      createdAt: new Date().toISOString(),
      lines: draftLines,
    };

    const next = [sale, ...sales];
    setSales(next);
    saveSales(next);

    setCustomerName("");
    setDraftLines([]);
  }

  function deleteSale(id: string) {
    if (!confirm("Delete this sale?")) return;
    const next = sales.filter((s) => s.id !== id);
    setSales(next);
    saveSales(next);
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Sales</h1>
          <div style={{ color: "#666", marginTop: 6 }}>Create sales orders (saved in your browser for now).</div>
        </div>
        <div style={{ color: "#666" }}>Orders: {sales.length}</div>
      </div>

      <section style={{ border: "1px solid #eee", borderRadius: 14, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>New sale</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#555" }}>Customer name</label>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={inputStyle} placeholder="e.g. John Smith" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "#555" }}>SKU</label>
              <input value={sku} onChange={(e) => setSku(e.target.value)} style={inputStyle} placeholder="e.g. SKU-001" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#555" }}>Item name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="e.g. Widget" />
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, marginTop: 12, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 12, color: "#555" }}>Qty</label>
            <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#555" }}>Unit price</label>
            <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} style={inputStyle} />
          </div>
          <div style={{ color: "#666", paddingBottom: 10 }}>Draft total: <b>{money(draftTotal)}</b></div>
          <button style={buttonStyle} onClick={addLine}>Add line</button>
        </div>

        {draftLines.length > 0 && (
          <div style={{ marginTop: 14, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>SKU</th>
                  <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>Name</th>
                  <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>Qty</th>
                  <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>Unit</th>
                  <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>Line total</th>
                  <th style={{ padding: 10, borderBottom: "1px solid #eee" }}></th>
                </tr>
              </thead>
              <tbody>
                {draftLines.map((l) => (
                  <tr key={l.id}>
                    <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }}>{l.sku}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }}>{l.name}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }}>{l.qty}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }}>{money(l.price)}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }}>{money(l.qty * l.price)}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }}>
                      <button style={buttonGhost} onClick={() => removeLine(l.id)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button style={buttonStyle} onClick={createSale}>Create sale</button>
            </div>
          </div>
        )}
      </section>

      <section style={{ border: "1px solid #eee", borderRadius: 14, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Recent sales</h2>

        {sales.length === 0 ? (
          <div style={{ color: "#666" }}>No sales yet. Create one above.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {sales.map((s) => (
              <div key={s.id} style={{ border: "1px solid #f1f1f1", borderRadius: 12, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{s.customerName}</div>
                    <div style={{ color: "#666", fontSize: 12 }}>
                      {new Date(s.createdAt).toLocaleString()} • {s.lines.length} items
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800 }}>{money(saleTotal(s))}</div>
                    <button style={{ ...buttonGhost, marginTop: 8 }} onClick={() => deleteSale(s.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
