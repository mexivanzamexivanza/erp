import { useEffect, useMemo, useState } from "react";
import {
  createInvoiceFromSalesOrder,
  listInvoiceLines,
  listInvoices,
  listPayments,
  listSalesOrders,
  recordPayment, voidInvoice,
} from "../lib/erpApi";
import type { InvoiceLineRow, InvoiceRow, PaymentRow, SalesOrderRow } from "../lib/erpApi";

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0));
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loadingInv, setLoadingInv] = useState(true);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
  const selectedInvoice = useMemo(
    () => invoices.find((i) => i.id === selectedInvoiceId) ?? null,
    [invoices, selectedInvoiceId]
  );

  const [lines, setLines] = useState<InvoiceLineRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // create invoice from sales order
  const [orders, setOrders] = useState<SalesOrderRow[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [salesOrderId, setSalesOrderId] = useState("");

  // record payment
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState("cash");
  const [payNote, setPayNote] = useState("");
  const [paying, setPaying] = useState(false);

  async function refreshInvoices() {
    setLoadingInv(true);
    try {
      setInvoices(await listInvoices());
    } catch (e: any) {
      alert(e.message ?? String(e));
    } finally {
      setLoadingInv(false);
    }
  }

  async function refreshOrders() {
    setLoadingOrders(true);
    try {
      setOrders(await listSalesOrders());
    } catch (e: any) {
      alert(e.message ?? String(e));
    } finally {
      setLoadingOrders(false);
    }
  }

  async function loadDetail(invoiceId: string) {
    setLoadingDetail(true);
    try {
      const [ls, ps] = await Promise.all([listInvoiceLines(invoiceId), listPayments(invoiceId)]);
      setLines(ls);
      setPayments(ps);
    } catch (e: any) {
      alert(e.message ?? String(e));
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    refreshInvoices();
    refreshOrders();
  }, []);

  useEffect(() => {
    if (!selectedInvoiceId) return;
    loadDetail(selectedInvoiceId);
  }, [selectedInvoiceId]);

  async function createInvoice() {
    if (!salesOrderId) return alert("Pick a sales order.");
    try {
      const inv = await createInvoiceFromSalesOrder({ sales_order_id: salesOrderId });
      await refreshInvoices();
      setSelectedInvoiceId(inv.id);
      alert("Invoice created.");
    } catch (e: any) {
      alert(e.message ?? String(e));
    }
  }

  async function doVoidInvoice() {
    if (!selectedInvoice) return alert("Select an invoice first.");
    const note = prompt("Void reason (optional):") ?? "";
    try {
      await voidInvoice({ invoice_id: selectedInvoice.id, note });
      await refreshInvoices();
      await loadDetail(selectedInvoice.id);
      alert("Invoice voided.");
    } catch (e: any) {
      alert(e.message ?? String(e));
    }
  }

  async function submitPayment() {
    if (!selectedInvoice) return alert("Select an invoice first.");
    if (payAmount <= 0) return alert("Payment amount must be > 0.");

    setPaying(true);
    try {
      await recordPayment({
        invoice_id: selectedInvoice.id,
        amount: Number(payAmount),
        method: payMethod,
        note: payNote.trim() || undefined,
      });

      setPayAmount(0);
      setPayNote("");

      await refreshInvoices();
      await loadDetail(selectedInvoice.id);
      alert("Payment recorded.");
    } catch (e: any) {
      alert(e.message ?? String(e));
    } finally {
      setPaying(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <h1 className="pageTitle">Invoices</h1>
          <div className="pageSub">Accounts Receivable (AR).</div>
        </div>
        <button className="btn" onClick={refreshInvoices}>{loadingInv ? "Loading..." : "Refresh"}</button>
      </div>

      <section className="card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Create invoice from sales order</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "end" }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Sales order</div>
            <select className="input" value={salesOrderId} onChange={(e) => setSalesOrderId(e.target.value)}>
              <option value="">{loadingOrders ? "Loading..." : "Select order..."}</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.customer_name} — {new Date(o.created_at).toLocaleString()} — {o.id.slice(0, 8)}...
                </option>
              ))}
            </select>
          </div>
          <button className="btn btnPrimary" onClick={createInvoice}>Create invoice</button>
        </div>
      </section>

      <section className="card" style={{ padding: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
          {/* Invoice list */}
          <div style={{ overflowX: "auto" }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Invoice list</div>
            {loadingInv ? (
              <div style={{ color: "var(--muted)" }}>Loading...</div>
            ) : invoices.length === 0 ? (
              <div style={{ color: "var(--muted)" }}>No invoices yet.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((i) => (
                    <tr
                      key={i.id}
                      style={{ cursor: "pointer", background: selectedInvoiceId === i.id ? "#f8fafc" : "transparent" }}
                      onClick={() => setSelectedInvoiceId(i.id)}
                    >
                      <td>{i.customer_name}</td>
                      <td>{i.status}</td>
                      <td>{money(i.total)}</td>
                      <td>{money(i.balance_due)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Detail */}
          <div className="card" style={{ padding: 12, minHeight: 220 }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Invoice detail</div>
            {!selectedInvoice ? (
              <div style={{ color: "var(--muted)" }}>Click an invoice to view details.</div>
            ) : loadingDetail ? (
              <div style={{ color: "var(--muted)" }}>Loading...</div>
            ) : (
              <>
                <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
                  <div><b>Customer:</b> {selectedInvoice.customer_name}</div>
                  <div><b>Status:</b> {selectedInvoice.status}</div>
                  <div><b>Total:</b> {money(selectedInvoice.total)}</div>
                  <div><b>Paid:</b> {money(selectedInvoice.amount_paid)}</div>
                  <div><b>Balance due:</b> {money(selectedInvoice.balance_due)}</div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                    <button className="btn btnDanger" onClick={doVoidInvoice}>Void invoice</button>
                  </div>
                </div>

                <hr className="sep" />

                <div style={{ fontWeight: 800, marginBottom: 6 }}>Lines</div>
                {lines.length === 0 ? (
                  <div style={{ color: "var(--muted)" }}>No lines.</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>SKU</th>
                          <th>Name</th>
                          <th>Qty</th>
                          <th>Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((l) => (
                          <tr key={l.id}>
                            <td>{l.sku}</td>
                            <td>{l.name}</td>
                            <td>{l.qty}</td>
                            <td>{money(l.price)}</td>
                            <td>{money(l.line_total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ height: 10 }} />

                <div style={{ fontWeight: 800, marginBottom: 6 }}>Payments</div>
                {payments.length === 0 ? (
                  <div style={{ color: "var(--muted)" }}>No payments yet.</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>When</th>
                          <th>Amount</th>
                          <th>Method</th>
                          <th>Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr key={p.id}>
                            <td>{new Date(p.paid_at).toLocaleString()}</td>
                            <td>{money(p.amount)}</td>
                            <td>{p.method}</td>
                            <td>{p.note ?? ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <hr className="sep" />

                <div style={{ fontWeight: 800, marginBottom: 6 }}>Record payment</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Amount</div>
                    <input className="input" type="number" value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Method</div>
                    <select className="input" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="bank">Bank</option>
                      <option value="check">Check</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Note</div>
                  <input className="input" value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="Optional note..." />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                  <button className="btn btnPrimary" onClick={submitPayment} disabled={paying}>
                    {paying ? "Saving..." : "Record payment"}
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

