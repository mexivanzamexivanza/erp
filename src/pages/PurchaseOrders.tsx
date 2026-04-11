import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { listVendors, listProducts, listPurchaseOrders, createPurchaseOrder, approvePurchaseOrder, cancelPurchaseOrder, createBillFromPurchaseOrder, listPurchaseOrderLines } from "../lib/erpApi";
import type { VendorRow, ProductRow, PurchaseOrderRow, PurchaseOrderLineRow } from "../lib/erpApi";
import { generatePOPDF } from "../lib/pdfExport";
import RecordNotes from "../components/RecordNotes";

type DraftLine = { id: string; product_id: string; sku: string; name: string; qty: number; unit_cost: number };
function uid() { return "id_" + Math.random().toString(16).slice(2); }
function money(n: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0)); }

export default function PurchaseOrders() {
  const { t } = useTranslation();
  const [vendors, setVendors]     = useState<VendorRow[]>([]);
  const [products, setProducts]   = useState<ProductRow[]>([]);
  const [orders, setOrders]       = useState<PurchaseOrderRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [vendorId, setVendorId]   = useState("");
  const [vendorName, setVendorName] = useState("");
  const [notes, setNotes]         = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty]             = useState<number>(1);
  const [unitCost, setUnitCost]   = useState<number>(0);
  const [draftLines, setDraftLines] = useState<DraftLine[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderRow | null>(null);
  const [poLines, setPOLines]     = useState<PurchaseOrderLineRow[]>([]);
  const draftTotal = useMemo(() => draftLines.reduce((s, l) => s + l.qty * l.unit_cost, 0), [draftLines]);
  const selectedProduct = useMemo(() => products.find(p => p.id === productId) ?? null, [products, productId]);

  async function refresh() {
    setLoading(true);
    try {
      const [vs, ps, os] = await Promise.all([listVendors(), listProducts(), listPurchaseOrders()]);
      setVendors(vs); setProducts(ps); setOrders(os);
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  }
  async function loadPOLines(po: PurchaseOrderRow) {
    setSelectedPO(po);
    try { setPOLines(await listPurchaseOrderLines(po.id)); } catch (e: any) { alert(e.message); }
  }
  useEffect(() => { refresh(); }, []);
  useEffect(() => { if (selectedProduct) setUnitCost(Number(selectedProduct.cost ?? selectedProduct.price ?? 0)); }, [selectedProduct]);
  useEffect(() => { const v = vendors.find(x => x.id === vendorId); if (v) setVendorName(v.name); }, [vendorId, vendors]);

  function addLine() {
    if (!selectedProduct) return alert(t("purchaseOrders.pickProduct"));
    setDraftLines(prev => [...prev, { id: uid(), product_id: selectedProduct.id, sku: selectedProduct.sku, name: selectedProduct.name, qty: Number(qty), unit_cost: Number(unitCost) }]);
    setProductId(""); setQty(1); setUnitCost(0);
  }
  function removeLine(id: string) { setDraftLines(prev => prev.filter(l => l.id !== id)); }

  async function createPO() {
    if (!vendorName.trim()) return alert(t("purchaseOrders.vendorNameRequired"));
    if (draftLines.length === 0) return alert(t("purchaseOrders.addLine"));
    try {
      await createPurchaseOrder({ vendor_id: vendorId || undefined, vendor_name: vendorName, notes: notes || undefined, lines: draftLines.map(l => ({ product_id: l.product_id, qty: l.qty, unit_cost: l.unit_cost })) });
      setVendorId(""); setVendorName(""); setNotes(""); setDraftLines([]); await refresh(); alert(t("purchaseOrders.created"));
    } catch (e: any) { alert(e.message); }
  }
  async function handleApprove(id: string) {
    if (!confirm(t("common.confirm"))) return;
    try { await approvePurchaseOrder(id as any); await refresh(); alert(t("purchaseOrders.approved")); } catch (e: any) { alert(e.message); }
  }
  async function handleCancel(id: string) {
    const note = prompt(t("purchaseOrders.cancelNote")) ?? "";
    try { await cancelPurchaseOrder(id as any, note); await refresh(); alert(t("purchaseOrders.cancelled")); } catch (e: any) { alert(e.message); }
  }
  async function handleCreateBill(id: string) {
    try { await createBillFromPurchaseOrder({ purchase_order_id: id }); alert(t("purchaseOrders.billCreated")); } catch (e: any) { alert(e.message); }
  }

  const STATUS_COLORS: Record<string,string> = { draft:"badge-primary", approved:"badge-success", cancelled:"badge-danger", billed:"badge-warning" };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1 className="pageTitle">{t("purchaseOrders.title")}</h1><div className="pageSub">{t("purchaseOrders.subtitle")}</div></div>
        <button className="btn" onClick={refresh}>🔄 {t("common.refresh")}</button>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>{t("purchaseOrders.newPO")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("purchaseOrders.vendorOptional")}</div>
            <select className="input" value={vendorId} onChange={e => setVendorId(e.target.value)}>
              <option value="">{t("purchaseOrders.selectVendor")}</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("purchaseOrders.vendorName")} *</div>
            <input className="input" value={vendorName} onChange={e => setVendorName(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("purchaseOrders.notes")}</div>
            <input className="input" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <hr className="sep" />
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 10, alignItems: "end", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("purchaseOrders.product")}</div>
            <select className="input" value={productId} onChange={e => setProductId(e.target.value)}>
              <option value="">{t("purchaseOrders.selectProduct")}</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("purchaseOrders.qty")}</div>
            <input className="input" type="number" value={qty} onChange={e => setQty(Number(e.target.value))} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("purchaseOrders.unitCost")}</div>
            <input className="input" type="number" value={unitCost} onChange={e => setUnitCost(Number(e.target.value))} />
          </div>
          <button className="btn" onClick={addLine}>{t("purchaseOrders.addLine")}</button>
        </div>

        {draftLines.length > 0 && (
          <>
            <table className="table" style={{ marginBottom: 12 }}>
              <thead><tr><th>SKU</th><th>{t("common.name")}</th><th>{t("purchaseOrders.qty")}</th><th>{t("purchaseOrders.unitCost")}</th><th>{t("common.total")}</th><th></th></tr></thead>
              <tbody>{draftLines.map(l => (
                <tr key={l.id}>
                  <td style={{ fontFamily: "monospace", color: "var(--muted)" }}>{l.sku}</td>
                  <td style={{ fontWeight: 600 }}>{l.name}</td>
                  <td>{l.qty}</td>
                  <td>{money(l.unit_cost)}</td>
                  <td style={{ fontWeight: 700 }}>{money(l.qty * l.unit_cost)}</td>
                  <td><button className="btn btnDanger" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => removeLine(l.id)}>{t("purchaseOrders.remove")}</button></td>
                </tr>
              ))}</tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button className="btn" onClick={() => setDraftLines([])}>{t("purchaseOrders.clearDraft")}</button>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontWeight: 700 }}>{t("purchaseOrders.draftTotal")}: {money(draftTotal)}</span>
                <button className="btn btnPrimary" onClick={createPO}>{t("purchaseOrders.createPO")}</button>
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
        <div className="card">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>{t("purchaseOrders.recentPOs")}</div>
          {loading ? <div style={{ padding: 20, color: "var(--muted)" }}>{t("common.loading")}</div> :
           orders.length === 0 ? <div style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>{t("purchaseOrders.noPOs")}</div> : (
            <table className="table">
              <thead><tr><th>{t("purchaseOrders.vendor")}</th><th>{t("common.status")}</th><th>{t("common.total")}</th><th></th></tr></thead>
              <tbody>{orders.map(o => (
                <tr key={o.id} style={{ cursor: "pointer", background: selectedPO?.id === o.id ? "var(--primary-light)" : "white" }} onClick={() => loadPOLines(o)}>
                  <td style={{ fontWeight: 600 }}>{o.vendor_name}</td>
                  <td><span className={"badge " + (STATUS_COLORS[o.status] ?? "badge")}>{o.status}</span></td>
                  <td style={{ fontWeight: 700 }}>{money(o.total)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      {o.status === "draft"    && <button className="btn btnPrimary" style={{ fontSize: 11, padding: "3px 8px" }} onClick={e => { e.stopPropagation(); handleApprove(o.id); }}>{t("purchaseOrders.approve")}</button>}
                      {o.status === "approved" && <button className="btn" style={{ fontSize: 11, padding: "3px 8px" }} onClick={e => { e.stopPropagation(); handleCreateBill(o.id); }}>{t("purchaseOrders.createBill")}</button>}
                      <button className="btn" style={{ fontSize: 11, padding: "3px 8px" }} onClick={e => { e.stopPropagation(); loadPOLines(o); setTimeout(() => generatePOPDF(o, poLines), 300); }}>🖨️</button>
                      {o.status !== "cancelled" && <button className="btn btnDanger" style={{ fontSize: 11, padding: "3px 8px" }} onClick={e => { e.stopPropagation(); handleCancel(o.id); }}>{t("purchaseOrders.cancel")}</button>}
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 700 }}>{t("purchaseOrders.poLines")}</div>
            {selectedPO && <button className="btn" onClick={() => generatePOPDF(selectedPO, poLines)}>🖨️ {t("pdf.print")}</button>}
          </div>
          {!selectedPO ? <div style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>{t("purchaseOrders.clickToView")}</div> :
           poLines.length === 0 ? <div style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>{t("purchaseOrders.noLines")}</div> : (
            <>
              <table className="table">
                <thead><tr><th>SKU</th><th>{t("common.name")}</th><th>{t("purchaseOrders.qty")}</th><th>{t("purchaseOrders.unitCost")}</th><th>{t("common.total")}</th></tr></thead>
                <tbody>{poLines.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontFamily: "monospace", color: "var(--muted)" }}>{l.sku}</td>
                    <td style={{ fontWeight: 600 }}>{l.name}</td>
                    <td>{l.qty}</td>
                    <td>{money(l.unit_cost)}</td>
                    <td style={{ fontWeight: 700 }}>{money(l.line_total)}</td>
                  </tr>
                ))}</tbody>
              </table>
              <div style={{ padding: 16 }}>
                <RecordNotes entityType="purchase_order" entityId={selectedPO.id} authorName="ERP User" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}