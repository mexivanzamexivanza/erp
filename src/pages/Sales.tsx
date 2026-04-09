import { useEffect, useMemo, useState } from "react";
import { createSalesOrder, listCustomers, listProducts, listSalesOrders } from "../lib/erpApi";
import type { CustomerRow, ProductRow, SalesOrderRow } from "../lib/erpApi";

type DraftLine = {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  qty: number;
  price: number;
};

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function Sales() {
  // recent orders
  const [orders, setOrders] = useState<SalesOrderRow[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // dropdown data
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);

  // selection
  const [customerId, setCustomerId] = useState<string>("");
  const [productId, setProductId] = useState<string>("");

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId) ?? null,
    [customers, customerId]
  );

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId) ?? null,
    [products, productId]
  );

  // line form
  const [qty, setQty] = useState<number>(1);
  const [price, setPrice] = useState<number>(0);

  // draft
  const [draftLines, setDraftLines] = useState<DraftLine[]>([]);
  const draftTotal = useMemo(() => draftLines.reduce((s, l) => s + l.qty * l.price, 0), [draftLines]);

  async function refreshOrders() {
    setLoadingOrders(true);
    try {
      const rows = await listSalesOrders();
      setOrders(rows);
    } catch (e: any) {
      alert(e.message ?? String(e));
    } finally {
      setLoadingOrders(false);
    }
  }

  async function loadLookups() {
    setLoadingLookups(true);
    try {
      const [cs, ps] = await Promise.all([listCustomers(), listProducts()]);
      setCustomers(cs);
      setProducts(ps);
    } catch (e: any) {
      alert(e.message ?? String(e));
    } finally {
      setLoadingLookups(false);
    }
  }

  useEffect(() => {
    refreshOrders();
    loadLookups();
  }, []);

  // When selecting product, auto-fill price (and reset qty)
  useEffect(() => {
    if (!selectedProduct) return;
    setQty(1);
    setPrice(Number(selectedProduct.price ?? 0));
  }, [selectedProduct]);

  function addLine() {
    if (!selectedProduct) return alert("Pick a product first.");
    if (qty <= 0) return alert("Qty must be > 0");
    if (price < 0) return alert("Price cannot be negative");

    setDraftLines((prev) => [
      ...prev,
      {
        id: uid("line"),
        product_id: selectedProduct.id,
        sku: selectedProduct.sku,
        name: selectedProduct.name,
        qty: Number(qty),
        price: Number(price),
      },
    ]);

    // clear product selection for next add
    setProductId("");
    setQty(1);
    setPrice(0);
  }

  function removeLine(id: string) {
    setDraftLines((prev) => prev.filter((l) => l.id !== id));
  }

  async function createOrder() {
    if (!selectedCustomer) return alert("Pick a customer.");
    if (draftLines.length === 0) return alert("Add at least one line item.");

    try {
      await createSalesOrder({
        customer_name: selectedCustomer.name,
        customer_id: selectedCustomer.id,
        lines: draftLines.map((l) => ({
          product_id: l.product_id,
          sku: l.sku,
          name: l.name,
          qty: l.qty,
          price: l.price,
        })),
      });

      setDraftLines([]);
      await refreshOrders();
      await loadLookups(); // refresh product stock display etc.
      alert("Order created.");
    } catch (e: any) {
      alert(e.message ?? String(e));
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <h1 className="pageTitle">Sales</h1>
          <div className="pageSub">Pick customer + products, then create an order.</div>
        </div>
        <div className="badge">Draft total: {money(draftTotal)}</div>
      </div>

      <section className="card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>New sales order</div>

        {loadingLookups ? (
          <div style={{ color: "var(--muted)" }}>Loading customers/products...</div>
        ) : (
          <>
            {/* Customer dropdown */}
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Customer</div>
              <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.email ? ` (${c.email})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <hr className="sep" />

            {/* Product dropdown */}
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Product</div>
              <select className="input" value={productId} onChange={(e) => setProductId(e.target.value)}>
                <option value="">Select product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} — {p.name} (Stock: {p.stock})
                  </option>
                ))}
              </select>

              {selectedProduct && (
                <div style={{ color: "var(--muted)", fontSize: 12 }}>
                  Price: ${Number(selectedProduct.price).toFixed(2)} • Stock: {selectedProduct.stock}
                </div>
              )}
            </div>

            {/* Line fields */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, marginTop: 12, alignItems: "end" }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Qty</div>
                <input className="input" type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Unit price</div>
                <input className="input" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
              </div>
              <button className="btn" onClick={addLine}>Add line</button>
            </div>

            {/* Draft table */}
            {draftLines.length > 0 && (
              <div style={{ marginTop: 12, overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Name</th>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {draftLines.map((l) => (
                      <tr key={l.id}>
                        <td>{l.sku}</td>
                        <td>{l.name}</td>
                        <td>{l.qty}</td>
                        <td>{money(l.price)}</td>
                        <td>{money(l.qty * l.price)}</td>
                        <td style={{ textAlign: "right" }}>
                          <button className="btn btnDanger" onClick={() => removeLine(l.id)}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, gap: 10 }}>
                  <button className="btn" onClick={() => { setDraftLines([]); }}>Clear draft</button>
                  <button className="btn btnPrimary" onClick={createOrder}>Create order</button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <section className="card" style={{ padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ fontWeight: 800 }}>Recent orders</div>
          <button className="btn" onClick={refreshOrders}>{loadingOrders ? "Loading..." : "Refresh"}</button>
        </div>

        <div style={{ marginTop: 12 }}>
          {loadingOrders ? (
            <div style={{ color: "var(--muted)" }}>Loading...</div>
          ) : orders.length === 0 ? (
            <div style={{ color: "var(--muted)" }}>No orders yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Order ID</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>{o.customer_name}</td>
                      <td>{o.status}</td>
                      <td>{new Date(o.created_at).toLocaleString()}</td>
                      <td style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 12 }}>
                        {o.id.slice(0, 8)}...
                      </td>
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
