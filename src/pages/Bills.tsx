import { useEffect, useMemo, useState } from "react";
import {
  createBillFromPurchaseOrder,
  createBillManual,
  listBillLines,
  listBillPayments,
  listBills,
  listProducts,
  listPurchaseOrders,
  listVendors,
  recordBillPayment,
  voidBill,
} from "../lib/erpApi";
import type {
  BillLineRow,
  BillPaymentRow,
  BillRow,
  ProductRow,
  PurchaseOrderRow,
  VendorRow,
} from "../lib/erpApi";

type DraftLine = {
  id: string;
  product_id: string | null;
  sku: string;
  name: string;
  qty: number;
  unit_cost: number;
};

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0));
}

export default function Bills() {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [pos, setPOs] = useState<PurchaseOrderRow[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);

  const [bills, setBills] = useState<BillRow[]>([]);
  const [loadingBills, setLoadingBills] = useState(true);

  const [selectedBillId, setSelectedBillId] = useState("");
  const selectedBill = useMemo(() => bills.find((b) => b.id === selectedBillId) ?? null, [bills, selectedBillId]);

  const [lines, setLines] = useState<BillLineRow[]>([]);
  const [payments, setPayments] = useState<BillPaymentRow[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // create from PO
  const [poId, setPoId] = useState("");

  // manual bill form
  const [vendorId, setVendorId] = useState("");
  const [vendorName, setVendorName] = useState("");

  const [productId, setProductId] = useState("");
  const selectedProduct = useMemo(() => products.find((p) => p.id === productId) ?? null, [products, productId]);
  const [qty, setQty] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [draftLines, setDraftLines] = useState<DraftLine[]>([]);
  const draftTotal = useMemo(() => draftLines.reduce((s, l) => s + l.qty * l.unit_cost, 0), [draftLines]);

  // payment form
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState("bank");
  const [payNote, setPayNote] = useState("");
  const [paying, setPaying] = useState(false);

  async function loadLookups() {
    setLoadingLookups(true);
    try {
      const [vs, ps, po] = await Promise.all([listVendors(), listProducts(), listPurchaseOrders()]);
      setVendors(vs);
      setProducts(ps);
      setPOs(po);
    } catch (e: any) {
      alert(e.message ?? String(e));
    } finally {
      setLoadingLookups(false);
    }
  }

  async function refreshBills() {
    setLoadingBills(true);
    try {
      setBills(await listBills());
    } catch (e: any) {
      alert(e.message ?? String(e));
    } finally {
      setLoadingBills(false);
    }
  }

  async function loadDetail(billId: string) {
    setLoadingDetail(true);
    try {
      const [ls, ps] = await Promise.all([listBillLines(billId), listBillPayments(billId)]);
      setLines(ls);
      setPayments(ps);
    } catch (e: any) {
      alert(e.message ?? String(e));
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    loadLookups();
    refreshBills();
  }, []);

  useEffect(() => {
    if (!selectedBillId) return;
    loadDetail(selectedBillId);
  }, [selectedBillId]);

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

  async function createFromPO() {
    if (!poId) return alert("Pick a PO.");
    try {
      await createBillFromPurchaseOrder({ purchase_order_id: poId });
      setPoId("");
      await refreshBills();
      alert("Bill created from PO.");
    } catch (e: any) {
      alert(e.message ?? String(e));
    }
  }

  async function createManual() {
    const vName = vendorName.trim();
    if (!vName) return alert("Vendor name required.");
    if (draftLines.length === 0) return alert("Add at least one line.");

    try {
      await createBillManual({
        vendor_id: vendorId || null,
        vendor_name: vName,
        lines: draftLines.map((l) => ({
          product_id: l.product_id,
          sku: l.sku,
          name: l.name,
          qty: l.qty,
          unit_cost: l.unit_cost,
        })),
      });

      setVendorId("");
      setVendorName("");
      setDraftLines([]);
      await refreshBills();
      alert("Manual bill created.");
    } catch (e: any) {
      alert(e.message ?? String(e));
    }
  }

  async function submitPayment() {
    if (!selectedBill) return alert("Select a bill first.");
    if (payAmount <= 0) return alert("Payment amount must be > 0.");

    setPaying(true);
    try {
      await recordBillPayment({
        bill_id: selectedBill.id,
        amount: Number(payAmount),
        method: payMethod,
        note: payNote.trim() || undefined,
      });

      setPayAmount(0);
      setPayNote("");

      await refreshBills();
      await loadDetail(selectedBill.id);
      alert("Bill payment recorded.");
    } catch (e: any) {
      alert(e.message ?? String(e));
    } finally {
      setPaying(false);
    }
  }

  async function doVoid() {
    if (!selectedBill) return alert("Select a bill first.");
    const note = prompt("Void reason (optional):") ?? "";
    try {
      await voidBill({ bill_id: selectedBill.id, note });
      await refreshBills();
      await loadDetail(selectedBill.id);
      alert("Bill voided.");
    } catch (e: any) {
      alert(e.message ?? String(e));
    }
  }

  const linesTotal = useMemo(() => lines.reduce((s, l) => s + Number(l.line_total || 0), 0), [lines]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <h1 className="pageTitle">Bills (A/P)</h1>
          <div className="pageSub">Managers/Admins only. Vendor bills, payments, and payable balances.</div>
        </div>
        <button className="btn" onClick={refreshBills}>{loadingBills ? "Loading..." : "Refresh"}</button>
      </div>

      <section className="card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Create bill from purchase order</div>

        {loadingLookups ? (
          <div style={{ color: "var(--muted)" }}>Loading POs...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "end" }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Purchase order</div>
              <select className="input" value={poId} onChange={(e) => setPoId(e.target.value)}>
                <option value="">Select PO...</option>
                {pos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.vendor_name} — {p.status} — {new Date(p.created_at).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btnPrimary" onClick={createFromPO}>Create bill</button>
          </div>
        )}
      </section>

      <section className="card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Create manual bill</div>

        {loadingLookups ? (
          <div style={{ color: "var(--muted)" }}>Loading vendors/products...</div>
        ) : (
          <>
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

            <hr className="sep" />

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

            {draftLines.length > 0 && (
              <div style={{ marginTop: 12, overflowX: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                  <div style={{ fontWeight: 800 }}>Draft lines</div>
                  <div className="badge">Draft total: {money(draftTotal)}</div>
                </div>

                <table className="table" style={{ marginTop: 10 }}>
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
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
              <button className="btn btnPrimary" onClick={createManual}>Create manual bill</button>
            </div>
          </>
        )}
      </section>

      <section className="card" style={{ padding: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Recent bills</div>
            {loadingBills ? (
              <div style={{ color: "var(--muted)" }}>Loading...</div>
            ) : bills.length === 0 ? (
              <div style={{ color: "var(--muted)" }}>No bills yet.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Status</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((b) => (
                    <tr
                      key={b.id}
                      style={{ cursor: "pointer", background: b.id === selectedBillId ? "rgba(0,0,0,0.04)" : undefined }}
                      onClick={() => setSelectedBillId(b.id)}
                    >
                      <td>{b.vendor_name}</td>
                      <td>{b.status}</td>
                      <td style={{ fontWeight: 900 }}>{money(b.balance_due)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Bill detail</div>
              {selectedBill && <div className="badge">{selectedBill.status}</div>}
            </div>

            {!selectedBill ? (
              <div style={{ color: "var(--muted)" }}>Select a bill to view detail.</div>
            ) : loadingDetail ? (
              <div style={{ color: "var(--muted)" }}>Loading detail...</div>
            ) : (
              <>
                <div style={{ display: "grid", gap: 4, marginBottom: 10 }}>
                  <div><b>Vendor:</b> {selectedBill.vendor_name}</div>
                  <div><b>Total:</b> {money(selectedBill.total)}</div>
                  <div><b>Paid:</b> {money(selectedBill.amount_paid)}</div>
                  <div><b>Balance:</b> {money(selectedBill.balance_due)}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    Bill ID: {selectedBill.id}
                  </div>
                </div>

                <div style={{ fontWeight: 800, marginTop: 10 }}>Lines</div>
                {lines.length === 0 ? (
                  <div style={{ color: "var(--muted)" }}>No lines.</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="table" style={{ marginTop: 8 }}>
                      <thead>
                        <tr>
                          <th>SKU</th>
                          <th>Name</th>
                          <th>Qty</th>
                          <th>Unit cost</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((l) => (
                          <tr key={l.id}>
                            <td>{l.sku}</td>
                            <td>{l.name}</td>
                            <td>{l.qty}</td>
                            <td>{money(l.unit_cost)}</td>
                            <td>{money(l.line_total)}</td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={4} style={{ textAlign: "right", fontWeight: 900 }}>Lines total</td>
                          <td style={{ fontWeight: 900 }}>{money(linesTotal)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ fontWeight: 800, marginTop: 12 }}>Payments</div>
                {payments.length === 0 ? (
                  <div style={{ color: "var(--muted)" }}>No payments.</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="table" style={{ marginTop: 8 }}>
                      <thead>
                        <tr>
                          <th>When</th>
                          <th>Method</th>
                          <th>Amount</th>
                          <th>Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr key={p.id}>
                            <td>{new Date(p.paid_at).toLocaleString()}</td>
                            <td>{p.method}</td>
                            <td style={{ fontWeight: 900 }}>{money(p.amount)}</td>
                            <td>{p.note ?? ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <hr className="sep" />

                <div style={{ fontWeight: 800, marginBottom: 8 }}>Record payment</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Amount</div>
                    <input className="input" type="number" value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Method</div>
                    <select className="input" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                      <option value="bank">bank</option>
                      <option value="cash">cash</option>
                      <option value="check">check</option>
                      <option value="card">card</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Note (optional)</div>
                    <input className="input" value={payNote} onChange={(e) => setPayNote(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 12 }}>
                  <button className="btn btnDanger" onClick={doVoid}>Void bill</button>
                  <button className="btn btnPrimary" disabled={paying} onClick={submitPayment}>
                    {paying ? "Paying..." : "Record payment"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
