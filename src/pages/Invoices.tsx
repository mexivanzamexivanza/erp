import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { createInvoiceFromSalesOrder, listInvoiceLines, listPayments, listInvoices, listSalesOrders, recordPayment, voidInvoice } from "../lib/erpApi";
import type { InvoiceRow, InvoiceLineRow, PaymentRow, SalesOrderRow } from "../lib/erpApi";
import { generateInvoicePDF } from "../lib/pdfExport";
import RecordNotes from "../components/RecordNotes";

function money(n: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0)); }

export default function Invoices() {
  const { t } = useTranslation();
  const [orders, setOrders]     = useState<SalesOrderRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const selected = useMemo(() => invoices.find(i => i.id === selectedId) ?? null, [invoices, selectedId]);
  const [lines, setLines]       = useState<InvoiceLineRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [orderId, setOrderId]   = useState("");
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState("bank");
  const [payNote, setPayNote]   = useState("");
  const [paying, setPaying]     = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const [os, inv] = await Promise.all([listSalesOrders(), listInvoices()]);
      setOrders(os); setInvoices(inv);
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  }
  async function loadDetail(id: string) {
    setLoadingDetail(true);
    try {
      const [ls, ps] = await Promise.all([listInvoiceLines(id), listPayments(id)]);
      setLines(ls); setPayments(ps);
    } catch (e: any) { alert(e.message); } finally { setLoadingDetail(false); }
  }
  useEffect(() => { refresh(); }, []);
  useEffect(() => { if (selectedId) loadDetail(selectedId); }, [selectedId]);

  async function handleCreate() {
    if (!orderId) return alert(t("invoices.pickOrder"));
    try {
      await createInvoiceFromSalesOrder({ sales_order_id: orderId });
      setOrderId(""); await refresh(); alert(t("invoices.created"));
    } catch (e: any) { alert(e.message); }
  }

  async function handlePayment() {
    if (!selected) return;
    if (payAmount <= 0) return alert(t("invoices.paymentAmountError"));
    setPaying(true);
    try {
      await recordPayment({ invoice_id: selected.id, amount: payAmount, method: payMethod, note: payNote || undefined });
      setPayAmount(0); setPayNote("");
      await refresh(); await loadDetail(selected.id);
      alert(t("invoices.paymentRecorded"));
    } catch (e: any) { alert(e.message); } finally { setPaying(false); }
  }

  async function handleVoid() {
    if (!selected) return;
    const reason = prompt(t("invoices.voidReason")) ?? "";
    try {
      await voidInvoice({ invoice_id: selected.id, note: reason });
      await refresh(); await loadDetail(selected.id);
      alert(t("invoices.voided"));
    } catch (e: any) { alert(e.message); }
  }

  const STATUS_COLORS: Record<string, string> = { draft:"badge-primary", sent:"badge-warning", paid:"badge-success", void:"badge-danger" };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1 className="pageTitle">{t("invoices.title")}</h1><div className="pageSub">{t("invoices.subtitle")}</div></div>
        <button className="btn" onClick={refresh}>🔄 {t("common.refresh")}</button>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>{t("invoices.createFromOrder")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "end" }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("nav.salesOrders")}</div>
            <select className="input" value={orderId} onChange={e => setOrderId(e.target.value)}>
              <option value="">{t("invoices.selectOrder")}</option>
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.customer_name} — {o.status} — {new Date(o.created_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btnPrimary" onClick={handleCreate}>{t("invoices.createInvoice")}</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 16, alignItems: "start" }}>
        <div className="card">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>{t("invoices.list")}</div>
          {loading ? (
            <div style={{ padding: 20, color: "var(--muted)" }}>{t("common.loading")}</div>
          ) : invoices.length === 0 ? (
            <div style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>{t("invoices.noInvoices")}</div>
          ) : invoices.map(inv => (
            <div key={inv.id} onClick={() => setSelectedId(inv.id)}
              style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: inv.id === selectedId ? "var(--primary-light)" : "white" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 700 }}>{inv.customer_name}</div>
                <span className={"badge " + (STATUS_COLORS[inv.status] ?? "badge")}>{inv.status}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{new Date(inv.created_at).toLocaleDateString()}</span>
                <span style={{ fontWeight: 700, color: Number(inv.balance_due) > 0 ? "var(--danger)" : "var(--success)" }}>{money(inv.balance_due)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          {!selected ? (
            <div style={{ padding: 40, color: "var(--muted)", textAlign: "center" }}>👈 {t("invoices.selectPrompt")}</div>
          ) : loadingDetail ? (
            <div style={{ padding: 20, color: "var(--muted)" }}>{t("common.loading")}</div>
          ) : (
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{selected.customer_name}</div>
                  <span className={"badge " + (STATUS_COLORS[selected.status] ?? "badge")}>{selected.status}</span>
                </div>
                <button className="btn" onClick={() => generateInvoicePDF(selected, lines, payments)}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  🖨️ {t("pdf.print")}
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div style={{ background: "#f8fafc", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{t("common.total")}</div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{money(selected.total)}</div>
                </div>
                <div style={{ background: "#f0fdf4", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{t("invoices.paid")}</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: "var(--success)" }}>{money(selected.amount_paid)}</div>
                </div>
                <div style={{ background: "#fef2f2", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{t("invoices.balanceDue")}</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: "var(--danger)" }}>{money(selected.balance_due)}</div>
                </div>
              </div>

              <div style={{ fontWeight: 700, marginBottom: 8 }}>{t("invoices.lines")}</div>
              {lines.length === 0 ? (
                <div style={{ color: "var(--muted)", marginBottom: 12 }}>{t("invoices.noLines")}</div>
              ) : (
                <table className="table" style={{ marginBottom: 16 }}>
                  <thead>
                    <tr><th>SKU</th><th>{t("common.name")}</th><th>{t("sales.qty")}</th><th>{t("invoices.price")}</th><th>{t("common.total")}</th></tr>
                  </thead>
                  <tbody>
                    {lines.map(l => (
                      <tr key={l.id}>
                        <td style={{ fontFamily: "monospace", color: "var(--muted)" }}>{l.sku}</td>
                        <td style={{ fontWeight: 600 }}>{l.name}</td>
                        <td>{l.qty}</td>
                        <td>{money(l.price)}</td>
                        <td style={{ fontWeight: 700 }}>{money(l.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div style={{ fontWeight: 700, marginBottom: 8 }}>{t("invoices.payments")}</div>
              {payments.length === 0 ? (
                <div style={{ color: "var(--muted)", marginBottom: 12 }}>{t("invoices.noPayments")}</div>
              ) : (
                <table className="table" style={{ marginBottom: 16 }}>
                  <thead>
                    <tr><th>{t("common.date")}</th><th>{t("invoices.method")}</th><th>{t("common.amount")}</th></tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id}>
                        <td>{new Date(p.paid_at).toLocaleString()}</td>
                        <td>{p.method}</td>
                        <td style={{ fontWeight: 700 }}>{money(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {selected.status !== "paid" && selected.status !== "void" && (
                <>
                  <hr className="sep" />
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>{t("invoices.recordPayment")}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("common.amount")}</div>
                      <input className="input" type="number" min={0} step="0.01"
                        value={payAmount} onChange={e => setPayAmount(Number(e.target.value))} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("invoices.method")}</div>
                      <select className="input" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                        <option value="bank">{t("invoices.bank")}</option>
                        <option value="cash">{t("invoices.cash")}</option>
                        <option value="card">{t("invoices.card")}</option>
                        <option value="check">{t("invoices.check")}</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("common.notes")}</div>
                    <input className="input" value={payNote} onChange={e => setPayNote(e.target.value)} />
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                    <button className="btn btnDanger" onClick={handleVoid}>{t("invoices.voidInvoice")}</button>
                    <button className="btn btnPrimary" onClick={handlePayment} disabled={paying}>
                      {paying ? t("common.saving") : t("invoices.recordPayment")}
                    </button>
                  </div>
                </>
              )}

              <RecordNotes entityType="invoice" entityId={selected.id} authorName="ERP User" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}