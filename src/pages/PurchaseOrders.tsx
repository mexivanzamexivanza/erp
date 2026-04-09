import { useEffect, useMemo, useState } from "react";
import {
  createPurchaseOrder,
  approvePurchaseOrder, createBillFromPurchaseOrder,
  cancelPurchaseOrder,
  listProducts,
  listPurchaseOrderLines,
  listPurchaseOrders,
  listVendors,
} from "../lib/erpApi";
import type { ProductRow, PurchaseOrderLineRow, PurchaseOrderRow, VendorRow } from "../lib/erpApi";

type DraftLine = {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  qty: number;
  unit_cost: number;
};

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function PurchaseOrders() {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);

  const [orders, setOrders] = useState<PurchaseOrderRow[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [selectedPoId, setSelectedPoId] = useState<string>("");
  const [selectedPoLines, setSelectedPoLines] = useState<PurchaseOrderLineRow[]>([]);
  const [loadingLines, setLoadingLines] = useState(false);

  // new PO form
  const [vendorId, setVendorId] = useState<string>("");
  const [vendorName, setVendorName] = useState<string>("");
  const [notes, setNotes] = useState("");

  const selectedVendor = useMemo(
    () => vendors.find((v) => v.id === vendorId) ?? null,
    [vendors, vendorId]
  );

  // draft lines
  const [productId, setProductId] = useState<string>("");
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId) ?? null,
    [products, productId]
  );

  const [qty, setQty] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [draftLines, setDraftLines] = useState<DraftLine[]>([]);
  const draftTotal = useMemo(() => draftLines.reduce((s, l) => s + l.qty * l.unit_cost, 0), [draftLines]);

  async function loadLookups() {
    setLoadingLookups(true);
    try {
      const [vs, ps] = await Promise.all([listVendors(), listProducts()]);
      setVendors(vs);
      setProducts(ps);
    } catch (e: any) {
      alert(e.message ?? String(e));
    } finally {
      setLoadingLookups(false);
    }
  }

  async function refreshOrders() {
    setLoadingOrders(true);
    try {
      setOrders(await listPurchaseOrders());
    } catch (e: any) {
      alert(e.message ?? String(e));
    } finally {
      setLoadingOrders(false);
    }
  }

  async function loadLines(poId: string) {
    setLoadingLines(true);
    try {
      setSelectedPoLines(await listPurchaseOrderLines(poId));
    } catch (e: any) {
      alert(e.message ?? String(e));
    } finally {
      setLoadingLines(false);
    }
  }

  useEffect(() => {
    loadLookups();
    refreshOrders();
  }, []);

  useEffect(() => {
    if (!selectedPoId) return;
    loadLines(selectedPoId);
  }, [selectedPoId]);

  useEffect(() => {
    if (!selectedProduct) return;
    setQty(1);
    setUnitCost(0);
  }, [selectedProduct]);

  // keep vendorName in sync if vendor selected
  useEffect(() => {
    if (!selectedVendor) return;
    setVendorName(selectedVendor.name);
  }, [selectedVendor]);

  function addLine() {
    if (!selectedProduct) return alert("Pick a product.");
    if (qty <= 0) return alert("Qty must be > 0");
    if (unitCost < 0) return alert("Unit cost cannot be negative");

    setDraftLines((prev) => [
      ...prev,
      {
        id: uid("line"),
        product_id: selectedProduct.id,
        sku: selectedProduct.sku,
        name: selectedProduct.name,
        qty: Number(qty),
        unit_cost: Number(unitCost),
      },
    ]);

    setProductId("");
    setQty(1);
    setUnitCost(0);
  }

  function removeLine(id: string) {
    setDraftLines((prev) => prev.filter((l) => l.id !== id));
  }

  async function createPO() {
    const vName = vendorName.trim();
    if (!vName) return alert("Vendor name required (pick a vendor or type a name).");
    if (draftLines.length === 0) return alert("Add at least one line.");

    try {
      await createPurchaseOrder({
        vendor_id: vendorId || null,
        vendor_name: vName,
        notes: notes.trim() || undefined,
        lines: draftLines.map((l) => ({
          product_id: l.product_id,
          sku: l.sku,
          name: l.name,
          qty: l.qty,
          unit_cost: l.unit_cost,
        })),
      });

      setDraftLines([]);
      setNotes("");
      setVendorId("");
      setVendorName("");

      await refreshOrders();
      alert("PO created (draft).");
    } catch (e: any) {
      alert(e.message ?? String(e));
    }
  }


  async function createBillForSelectedPO() {
    if (!selectedPoId) return alert("Select a PO first.");
    try {
      await createBillFromPurchaseOrder({ purchase_order_id: selectedPoId });
      alert("Bill created from PO.");
    } catch (e: any) {
      alert(e.message ?? String(e));
    }
  }

  async function approveSelectedPO() {
    if (!selectedPoId) return alert("Select a PO first.");
    try {
      await approvePurchaseOrder(selectedPoId);
      await refreshOrders();
      alert("PO approved.");
    } catch (e: any) {
      alert(e.message ?? String(e));
    }
  }

  async function cancelSelectedPO() {
    if (!selectedPoId) return alert("Select a PO first.");
    const note = prompt("Cancel note (optional):") ?? "";
    try {
      await cancelPurchaseOrder(selectedPoId, note);
      await refreshOrders();
      alert("PO cancelled.");
    } catch (e: any) {
      alert(e.message ?? String(e));
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <h1 className="pageTitle">Purchase orders</h1>
          <div className="pageSub">Create draft POs (we’ll add receiving next).</div>
        </div>
        <div className="badge">Draft total: {money(draftTotal)}</div>
      </div>

      <section className="card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>New purchase order</div>

        {loadingLookups ? (
          <div style={{ color: "var(--muted)" }}>Loading vendors/products...</div>
        ) : (
          <>
            {/* Vendor */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Vendor (optional select)</div>
                <select className="input" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
                  <option value="">Select vendor...</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Vendor name (required)</div>
                <input className="input" value={vendorName} onChange={(e) => setVendorName(e.target.value)} />
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Notes</div>
              <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." />
            </div>

            <hr className="sep" />

            {/* Line add */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Product</div>
                <select className="input" value={productId} onChange={(e) => setProductId(e.target.value)}>
                  <option value="">Select product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} — {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Qty</div>
                <input className="input" type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
              </div>

              <div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Unit cost</div>
                <input className="input" type="number" value={unitCost} onChange={(e) => setUnitCost(Number(e.target.value))} />
              </div>

              <button className="btn" onClick={addLine}>Add line</button>
            </div>

            {/* Draft lines */}
            {draftLines.length > 0 && (
              <div style={{ marginTop: 12, overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Name</th>
                      <th>Qty</th>
                      <th>Unit cost</th>
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
                        <td>{money(l.unit_cost)}</td>
                        <td>{money(l.qty * l.unit_cost)}</td>
                        <td style={{ textAlign: "right" }}>
                          <button className="btn btnDanger" onClick={() => removeLine(l.id)}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, gap: 10 }}>
                  <button className="btn" onClick={() => setDraftLines([])}>Clear draft</button>
                  <button className="btn btnPrimary" onClick={createPO}>Create PO</button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <section className="card" style={{ padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ fontWeight: 800 }}>Recent purchase orders</div>
          <button className="btn" onClick={refreshOrders}>{loadingOrders ? "Loading..." : "Refresh"}</button>
        </div>

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
          <div style={{ overflowX: "auto" }}>
            {loadingOrders ? (
              <div style={{ color: "var(--muted)" }}>Loading...</div>
            ) : orders.length === 0 ? (
              <div style={{ color: "var(--muted)" }}>No POs yet.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr
                      key={o.id}
                      style={{ cursor: "pointer", background: selectedPoId === o.id ? "#f8fafc" : "transparent" }}
                      onClick={() => setSelectedPoId(o.id)}
                    >
                      <td>{o.vendor_name}</td>
                      <td>{o.status}</td>
                      <td>{new Date(o.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card" style={{ padding: 12, minHeight: 180 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 8 }}>
  <div style={{ fontWeight: 800 }}>PO lines</div>
  <div style={{ display: "flex", gap: 8 }}>
    <button className="btn" onClick={approveSelectedPO} disabled={!selectedPoId}>Approve</button>
    
    <button className="btn btnPrimary" onClick={createBillForSelectedPO} disabled={!selectedPoId}>Create Bill</button><button className="btn btnDanger" onClick={cancelSelectedPO} disabled={!selectedPoId}>Cancel</button>
  </div>
</div>
            {!selectedPoId ? (
              <div style={{ color: "var(--muted)" }}>Click a PO to view lines.</div>
            ) : loadingLines ? (
              <div style={{ color: "var(--muted)" }}>Loading lines...</div>
            ) : selectedPoLines.length === 0 ? (
              <div style={{ color: "var(--muted)" }}>No lines found.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Name</th>
                      <th>Qty</th>
                      <th>Unit cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPoLines.map((l) => (
                      <tr key={l.id}>
                        <td>{l.sku}</td>
                        <td>{l.name}</td>
                        <td>{l.qty}</td>
                        <td>{money(Number(l.unit_cost))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}



