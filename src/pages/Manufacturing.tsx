import { printElement } from "../lib/pdfExport";
import RecordNotes from "../components/RecordNotes";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { listWorkOrders, createWorkOrder, updateWorkOrderStatus, deleteWorkOrder, listBOMLines, addBOMLine, deleteBOMLine, listProducts } from "../lib/erpApi";
import type { WorkOrderRow, BOMLineRow, ProductRow } from "../lib/erpApi";

const STATUS_COLORS: Record<string, string> = { draft:"badge-primary", in_progress:"badge-warning", completed:"badge-success", cancelled:"badge-danger" };
const PRIORITY_COLORS: Record<string, string> = { low:"badge", medium:"badge-primary", high:"badge-warning", critical:"badge-danger" };

export default function Manufacturing() {
  const { t } = useTranslation();
  const [orders, setOrders]       = useState<WorkOrderRow[]>([]);
  const [products, setProducts]   = useState<ProductRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<WorkOrderRow | null>(null);
  const [bomLines, setBomLines]   = useState<BOMLineRow[]>([]);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);

  const [ref, setRef]             = useState("");
  const [productId, setProductId] = useState("");
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity]   = useState("1");
  const [priority, setPriority]   = useState("medium");
  const [schedStart, setSchedStart] = useState("");
  const [schedEnd, setSchedEnd]   = useState("");
  const [notes, setNotes]         = useState("");

  const [bomComp, setBomComp]     = useState("");
  const [bomSku, setBomSku]       = useState("");
  const [bomQty, setBomQty]       = useState("1");
  const [bomUnit, setBomUnit]     = useState("pcs");

  async function refresh() {
    setLoading(true);
    try { const [ws, ps] = await Promise.all([listWorkOrders(), listProducts()]); setOrders(ws); setProducts(ps); }
    catch (e: any) { alert(e.message); } finally { setLoading(false); }
  }

  async function loadBOM(wo: WorkOrderRow) { setSelected(wo); try { setBomLines(await listBOMLines(wo.id)); } catch (e: any) { alert(e.message); } }
  useEffect(() => { refresh(); }, []);
  useEffect(() => { const p = products.find(x => x.id === productId); if (p) setProductName(p.name); }, [productId]);

  async function handleCreate() {
    if (!ref.trim() || !productName.trim()) return alert(t("manufacturing.refProductRequired"));
    setSaving(true);
    try { await createWorkOrder({ reference: ref, product_name: productName, product_id: productId || undefined, quantity: Number(quantity), priority, scheduled_start: schedStart || undefined, scheduled_end: schedEnd || undefined, notes: notes || undefined }); setRef(""); setProductId(""); setProductName(""); setQuantity("1"); setPriority("medium"); setSchedStart(""); setSchedEnd(""); setNotes(""); setShowForm(false); await refresh(); }
    catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }

  async function handleStatus(id: string, status: string) {
    try { await updateWorkOrderStatus(id, status); await refresh(); if (selected?.id === id) setSelected(o => o ? { ...o, status } : o); }
    catch (e: any) { alert(e.message); }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("common.confirm"))) return;
    try { await deleteWorkOrder(id); if (selected?.id === id) { setSelected(null); setBomLines([]); } await refresh(); }
    catch (e: any) { alert(e.message); }
  }

  async function handleAddBOM() {
    if (!selected || !bomComp.trim()) return alert(t("manufacturing.componentRequired"));
    try { await addBOMLine({ work_order_id: selected.id, component_name: bomComp, sku: bomSku || undefined, quantity_required: Number(bomQty), unit: bomUnit }); setBomComp(""); setBomSku(""); setBomQty("1"); await loadBOM(selected); }
    catch (e: any) { alert(e.message); }
  }

  async function handleDeleteBOM(id: string) {
    try { await deleteBOMLine(id); if (selected) await loadBOM(selected); } catch (e: any) { alert(e.message); }
  }

  const NEXT_STATUS: Record<string, string> = { draft: "in_progress", in_progress: "completed" };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1 className="pageTitle">{t("manufacturing.title")}</h1><div className="pageSub">{t("manufacturing.subtitle")}</div></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={refresh}>🔄 {t("common.refresh")}</button>
          <button className="btn btnPrimary" onClick={() => setShowForm(!showForm)}>{showForm ? t("common.cancel") : t("manufacturing.newWorkOrder")}</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: t("manufacturing.total"),      value: orders.length,                                       color: "var(--primary)" },
          { label: t("manufacturing.inProgress"), value: orders.filter(o => o.status === "in_progress").length, color: "var(--warning)" },
          { label: t("manufacturing.completed"),  value: orders.filter(o => o.status === "completed").length,   color: "var(--success)" },
          { label: t("manufacturing.draft"),      value: orders.filter(o => o.status === "draft").length,       color: "var(--muted)" },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ fontSize: 28, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>{t("manufacturing.newWorkOrder")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("manufacturing.reference")} *</div><input className="input" placeholder="WO-001" value={ref} onChange={e => setRef(e.target.value)} /></div>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("manufacturing.product")} *</div>
              <select className="input" value={productId} onChange={e => setProductId(e.target.value)}>
                <option value="">{t("manufacturing.selectProduct")}</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
              </select>
            </div>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("manufacturing.productName")} *</div><input className="input" value={productName} onChange={e => setProductName(e.target.value)} /></div>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("manufacturing.quantity")}</div><input className="input" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} /></div>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("manufacturing.priority")}</div>
              <select className="input" value={priority} onChange={e => setPriority(e.target.value)}>
                {["low","medium","high","critical"].map(p => <option key={p} value={p}>{t(`manufacturing.priorities.${p}`)}</option>)}
              </select>
            </div>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("manufacturing.schedStart")}</div><input className="input" type="date" value={schedStart} onChange={e => setSchedStart(e.target.value)} /></div>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("manufacturing.schedEnd")}</div><input className="input" type="date" value={schedEnd} onChange={e => setSchedEnd(e.target.value)} /></div>
            <div style={{ gridColumn: "1/-1" }}><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("common.notes")}</div><input className="input" value={notes} onChange={e => setNotes(e.target.value)} /></div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <button className="btn" onClick={() => setShowForm(false)}>{t("common.cancel")}</button>
            <button className="btn btnPrimary" onClick={handleCreate} disabled={saving}>{saving ? t("common.saving") : t("manufacturing.createWorkOrder")}</button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 16, alignItems: "start" }}>
        <div className="card">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>{t("manufacturing.workOrders")} ({orders.length})</div>
          {loading ? <div style={{ padding: 20, color: "var(--muted)" }}>{t("common.loading")}</div> : orders.length === 0 ? <div style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>{t("manufacturing.noOrders")}</div> : orders.map(o => (
            <div key={o.id} onClick={() => loadBOM(o)} style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: selected?.id === o.id ? "var(--primary-light)" : "white" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{o.reference}</div>
                <span className={`badge ${STATUS_COLORS[o.status]}`}>{t(`manufacturing.statuses.${o.status}`)}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{o.product_name} × {o.quantity}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <span className={`badge ${PRIORITY_COLORS[o.priority]}`} style={{ fontSize: 10 }}>{t(`manufacturing.priorities.${o.priority}`)}</span>
                {NEXT_STATUS[o.status] && <button className="btn btnPrimary" style={{ fontSize: 11, padding: "2px 8px" }} onClick={e => { e.stopPropagation(); handleStatus(o.id, NEXT_STATUS[o.status]); }}>{t(`manufacturing.statuses.${NEXT_STATUS[o.status]}`)}</button>}
                <button className="btn btnDanger" style={{ fontSize: 11, padding: "2px 8px" }} onClick={e => { e.stopPropagation(); handleDelete(o.id); }}>🗑</button>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          {!selected ? <div style={{ padding: 40, color: "var(--muted)", textAlign: "center" }}>👈 {t("manufacturing.selectOrder")}</div> : (
            <>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{selected.reference} — {t("manufacturing.bom")}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{selected.product_name} × {selected.quantity}</div>
              </div>
              <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>{t("manufacturing.addComponent")}</div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
                  <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("manufacturing.component")} *</div><input className="input" placeholder={t("manufacturing.componentPlaceholder")} value={bomComp} onChange={e => setBomComp(e.target.value)} /></div>
                  <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>SKU</div><input className="input" value={bomSku} onChange={e => setBomSku(e.target.value)} /></div>
                  <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("manufacturing.qty")}</div><input className="input" type="number" value={bomQty} onChange={e => setBomQty(e.target.value)} /></div>
                  <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("manufacturing.unit")}</div><input className="input" value={bomUnit} onChange={e => setBomUnit(e.target.value)} /></div>
                  <button className="btn btnPrimary" onClick={handleAddBOM}>{t("common.add")}</button>
                </div>
              </div>
              {bomLines.length === 0 ? <div style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>{t("manufacturing.noBOM")}</div> : (
                <table className="table">
                  <thead><tr><th>{t("manufacturing.component")}</th><th>SKU</th><th>{t("manufacturing.qty")}</th><th>{t("manufacturing.unit")}</th><th></th></tr></thead>
                  <tbody>{bomLines.map(l => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 600 }}>{l.component_name}</td><td style={{ color: "var(--muted)" }}>{l.sku ?? "—"}</td><td>{l.quantity_required}</td><td>{l.unit}</td>
                      <td><button className="btn btnDanger" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleDeleteBOM(l.id)}>✕</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
