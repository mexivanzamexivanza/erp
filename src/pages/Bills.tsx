import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { listBills, listBillLines, listBillPayments, createBillFromPurchaseOrder, createBillManual, recordBillPayment, voidBill, listPurchaseOrders, listProducts } from "../lib/erpApi";
import type { BillRow, BillLineRow, BillPaymentRow, PurchaseOrderRow, ProductRow } from "../lib/erpApi";
import { printElement } from "../lib/pdfExport";
import RecordNotes from "../components/RecordNotes";

function money(n: number) { return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(n||0)); }

export default function Bills() {
  const { t } = useTranslation();
  const [bills, setBills]         = useState<BillRow[]>([]);
  const [pos, setPOs]             = useState<PurchaseOrderRow[]>([]);
  const [products, setProducts]   = useState<ProductRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const selected = useMemo(() => bills.find(b => b.id === selectedId) ?? null, [bills, selectedId]);
  const [lines, setLines]         = useState<BillLineRow[]>([]);
  const [payments, setPayments]   = useState<BillPaymentRow[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [poId, setPoId]           = useState("");
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState("bank");
  const [paying, setPaying]       = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [draftLines, setDraftLines] = useState<{id:string;product_id:string;name:string;sku:string;qty:number;unit_cost:number}[]>([]);
  const [mProductId, setMProductId] = useState("");
  const [mQty, setMQty]           = useState(1);
  const [mCost, setMCost]         = useState(0);

  function uid() { return "id_" + Math.random().toString(16).slice(2); }
  const draftTotal = draftLines.reduce((s,l) => s + l.qty * l.unit_cost, 0);
  const selectedProduct = products.find(p => p.id === mProductId) ?? null;

  async function refresh() {
    setLoading(true);
    try {
      const [bs, ps, prods] = await Promise.all([listBills(), listPurchaseOrders(), listProducts()]);
      setBills(bs); setPOs(ps); setProducts(prods);
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  }
  async function loadDetail(id: string) {
    setLoadingDetail(true);
    try { const [ls, ps] = await Promise.all([listBillLines(id), listBillPayments(id)]); setLines(ls); setPayments(ps); }
    catch (e: any) { alert(e.message); } finally { setLoadingDetail(false); }
  }
  useEffect(() => { refresh(); }, []);
  useEffect(() => { if (selectedId) loadDetail(selectedId); }, [selectedId]);
  useEffect(() => { if (selectedProduct) setMCost(Number(selectedProduct.price ?? 0)); }, [selectedProduct]);

  async function handleCreateFromPO() {
    if (!poId) return alert(t("bills.pickPO"));
    try { await createBillFromPurchaseOrder({ purchase_order_id: poId }); setPoId(""); await refresh(); alert(t("bills.created")); }
    catch (e: any) { alert(e.message); }
  }
  async function handleCreateManual() {
    if (!vendorName.trim()) return alert(t("bills.vendor") + " required");
    if (draftLines.length === 0) return alert(t("bills.addLine") + " required");
    try {
      await createBillManual({ vendor_name: vendorName, lines: draftLines.map(l => ({ product_id: l.product_id, sku: l.sku, name: l.name, qty: l.qty, unit_cost: l.unit_cost })) });
      setVendorName(""); setManualNote(""); setDraftLines([]); await refresh(); alert(t("bills.created"));
    } catch (e: any) { alert(e.message); }
  }
  function addDraftLine() {
    if (!selectedProduct) return alert(t("bills.product") + " required");
    setDraftLines(prev => [...prev, { id: uid(), product_id: selectedProduct.id, name: selectedProduct.name, sku: selectedProduct.sku, qty: Number(mQty), unit_cost: Number(mCost) }]);
    setMProductId(""); setMQty(1); setMCost(0);
  }
  async function handlePayment() {
    if (!selected || payAmount <= 0) return alert(t("bills.paymentAmountError"));
    setPaying(true);
    try {
      await recordBillPayment({ bill_id: selected.id, amount: payAmount, method: payMethod });
      setPayAmount(0); await refresh(); await loadDetail(selected.id); alert(t("bills.paymentRecorded"));
    } catch (e: any) { alert(e.message); } finally { setPaying(false); }
  }
  async function handleVoid() {
    if (!selected) return;
    const reason = prompt(t("bills.voidReason")) ?? "";
    try { await voidBill({ bill_id: selected.id, note: reason }); await refresh(); await loadDetail(selected.id); alert(t("bills.voided")); }
    catch (e: any) { alert(e.message); }
  }
  function printBill() {
    if (!selected) return;
    const linesHtml = lines.map(l => `<tr><td>${l.sku??""}</td><td>${l.name??""}</td><td>${l.qty}</td><td style="text-align:right">$${Number(l.unit_cost??0).toFixed(2)}</td><td style="text-align:right;font-weight:600">$${Number(l.line_total??0).toFixed(2)}</td></tr>`).join("");
    printElement("Cuenta — " + selected.vendor_name, `
      <div class="title">${t("bills.title")}</div>
      <div class="info-grid">
        <div class="info-box"><div class="info-label">${t("bills.vendor")}</div><div class="info-value">${selected.vendor_name}</div></div>
        <div class="info-box"><div class="info-label">${t("common.status")}</div><div class="info-value">${selected.status}</div></div>
        <div class="info-box"><div class="info-label">${t("common.total")}</div><div class="info-value">$${Number(selected.total??0).toFixed(2)}</div></div>
        <div class="info-box"><div class="info-label">${t("bills.balanceDue")}</div><div class="info-value" style="color:#dc2626">$${Number(selected.balance_due??0).toFixed(2)}</div></div>
      </div>
      <table><thead><tr><th>SKU</th><th>${t("common.name")}</th><th>${t("bills.qty")}</th><th style="text-align:right">${t("bills.unitCost")}</th><th style="text-align:right">${t("common.total")}</th></tr></thead><tbody>${linesHtml}</tbody></table>
    `);
  }

  const STATUS_COLORS: Record<string,string> = { draft:"badge-primary", open:"badge-warning", paid:"badge-success", void:"badge-danger" };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1 className="pageTitle">{t("bills.title")}</h1><div className="pageSub">{t("bills.subtitle")}</div></div>
        <button className="btn" onClick={refresh}>🔄 {t("common.refresh")}</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>{t("bills.createFromPO")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "end" }}>
            <select className="input" value={poId} onChange={e => setPoId(e.target.value)}>
              <option value="">{t("bills.selectPO")}</option>
              {pos.map(o => <option key={o.id} value={o.id}>{o.vendor_name} — {o.status}</option>)}
            </select>
            <button className="btn btnPrimary" onClick={handleCreateFromPO}>{t("bills.createBill")}</button>
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>{t("bills.createManual")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <input className="input" placeholder={t("bills.vendorName")+" *"} value={vendorName} onChange={e => setVendorName(e.target.value)} />
            <input className="input" placeholder={t("bills.note")} value={manualNote} onChange={e => setManualNote(e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 8, alignItems: "end", marginBottom: 10 }}>
            <select className="input" value={mProductId} onChange={e => setMProductId(e.target.value)}>
              <option value="">{t("bills.product")}...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
            </select>
            <input className="input" type="number" placeholder={t("bills.qty")} value={mQty} onChange={e => setMQty(Number(e.target.value))} />
            <input className="input" type="number" placeholder={t("bills.unitCost")} value={mCost} onChange={e => setMCost(Number(e.target.value))} />
            <button className="btn" onClick={addDraftLine}>{t("bills.addLine")}</button>
          </div>
          {draftLines.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              {draftLines.map(l => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
                  <span>{l.sku} — {l.name} x{l.qty}</span>
                  <span style={{ fontWeight: 700 }}>{money(l.qty * l.unit_cost)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: 6 }}>
                <span>{t("bills.linesTotal")}</span><span>{money(draftTotal)}</span>
              </div>
            </div>
          )}
          <button className="btn btnPrimary" style={{ width: "100%" }} onClick={handleCreateManual}>{t("bills.createBill")}</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 16, alignItems: "start" }}>
        <div className="card">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>{t("bills.list")}</div>
          {loading ? <div style={{ padding: 20, color: "var(--muted)" }}>{t("common.loading")}</div> :
           bills.length === 0 ? <div style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>{t("bills.noBills")}</div> :
           bills.map(b => (
            <div key={b.id} onClick={() => setSelectedId(b.id)}
              style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: b.id === selectedId ? "var(--primary-light)" : "white" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 700 }}>{b.vendor_name}</div>
                <span className={"badge "+(STATUS_COLORS[b.status]??"badge")}>{b.status}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{new Date(b.created_at).toLocaleDateString()}</span>
                <span style={{ fontWeight: 700, color: Number(b.balance_due) > 0 ? "var(--danger)" : "var(--success)" }}>{money(b.balance_due)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          {!selected ? (
            <div style={{ padding: 40, color: "var(--muted)", textAlign: "center" }}>👈 {t("bills.selectPrompt")}</div>
          ) : loadingDetail ? (
            <div style={{ padding: 20, color: "var(--muted)" }}>{t("common.loading")}</div>
          ) : (
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{selected.vendor_name}</div>
                  <span className={"badge "+(STATUS_COLORS[selected.status]??"badge")}>{selected.status}</span>
                </div>
                <button className="btn" onClick={printBill}>🖨️ {t("pdf.print")}</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div style={{ background: "#f8fafc", borderRadius: 8, padding: 12 }}><div style={{ fontSize: 11, color: "var(--muted)" }}>{t("common.total")}</div><div style={{ fontWeight: 700, fontSize: 18 }}>{money(selected.total)}</div></div>
                <div style={{ background: "#f0fdf4", borderRadius: 8, padding: 12 }}><div style={{ fontSize: 11, color: "var(--muted)" }}>{t("bills.paid")}</div><div style={{ fontWeight: 700, fontSize: 18, color: "var(--success)" }}>{money(selected.amount_paid)}</div></div>
                <div style={{ background: "#fef2f2", borderRadius: 8, padding: 12 }}><div style={{ fontSize: 11, color: "var(--muted)" }}>{t("bills.balanceDue")}</div><div style={{ fontWeight: 700, fontSize: 18, color: "var(--danger)" }}>{money(selected.balance_due)}</div></div>
              </div>

              <div style={{ fontWeight: 700, marginBottom: 8 }}>{t("bills.lines")}</div>
              {lines.length === 0 ? <div style={{ color: "var(--muted)", marginBottom: 12 }}>{t("bills.noLines")}</div> : (
                <table className="table" style={{ marginBottom: 16 }}>
                  <thead><tr><th>SKU</th><th>{t("common.name")}</th><th>{t("bills.qty")}</th><th>{t("bills.unitCost")}</th><th>{t("common.total")}</th></tr></thead>
                  <tbody>{lines.map(l => <tr key={l.id}><td>{l.sku}</td><td>{l.name}</td><td>{l.qty}</td><td>{money(l.unit_cost)}</td><td style={{ fontWeight:700 }}>{money(l.line_total)}</td></tr>)}</tbody>
                </table>
              )}

              <div style={{ fontWeight: 700, marginBottom: 8 }}>{t("bills.payments")}</div>
              {payments.length === 0 ? <div style={{ color: "var(--muted)", marginBottom: 12 }}>{t("bills.noPayments")}</div> : (
                <table className="table" style={{ marginBottom: 16 }}>
                  <thead><tr><th>{t("common.date")}</th><th>{t("bills.method")}</th><th>{t("common.amount")}</th></tr></thead>
                  <tbody>{payments.map(p => <tr key={p.id}><td>{new Date(p.paid_at).toLocaleString()}</td><td>{p.method}</td><td style={{ fontWeight:700 }}>{money(p.amount)}</td></tr>)}</tbody>
                </table>
              )}

              {selected.status !== "paid" && selected.status !== "void" && (
                <>
                  <hr className="sep" />
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>{t("bills.recordPayment")}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" }}>
                    <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("common.amount")}</div><input className="input" type="number" value={payAmount} onChange={e => setPayAmount(Number(e.target.value))} /></div>
                    <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("bills.method")}</div>
                      <select className="input" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                        <option value="bank">Bank</option><option value="cash">Cash</option><option value="card">Card</option><option value="check">Check</option>
                      </select>
                    </div>
                    <button className="btn btnPrimary" onClick={handlePayment} disabled={paying}>{paying ? "..." : t("bills.recordPayment")}</button>
                  </div>
                  <button className="btn btnDanger" style={{ marginTop: 10 }} onClick={handleVoid}>{t("bills.voidBill")}</button>
                </>
              )}
              <RecordNotes entityType="bill" entityId={selected.id} authorName="ERP User" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}