import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { createInventoryMovement, listInventoryMovements, listProducts } from "../lib/erpApi";
import type { InventoryMovementRow, ProductRow } from "../lib/erpApi";

export default function StockMovements() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [movements, setMovements] = useState<InventoryMovementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [productId, setProductId] = useState("");
  const [reason, setReason] = useState<"receive" | "adjust">("receive");
  const [qtyDelta, setQtyDelta] = useState<number>(1);
  const [note, setNote] = useState("");
  const selectedProduct = useMemo(() => products.find((p) => p.id === productId) ?? null, [products, productId]);

  async function refresh() { setLoading(true); try { const [ps, ms] = await Promise.all([listProducts(), listInventoryMovements({ limit: 200 })]); setProducts(ps); setMovements(ms); } catch (e: any) { alert(e.message); } finally { setLoading(false); } }
  useEffect(() => { refresh(); }, []);

  async function submit() {
    if (!productId) return alert(t("stockMovements.pickProduct"));
    if (!Number.isFinite(qtyDelta) || qtyDelta === 0) return alert(t("stockMovements.qtyError"));
    const finalDelta = reason === "receive" ? Math.abs(Number(qtyDelta)) : Number(qtyDelta);
    try { await createInventoryMovement({ product_id: productId, qty_delta: finalDelta, reason, note: note.trim() || undefined }); setQtyDelta(1); setNote(""); await refresh(); alert(t("stockMovements.stockUpdated")); } catch (e: any) { alert(e.message); }
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1 className="pageTitle">{t("stockMovements.title")}</h1><div className="pageSub">{t("stockMovements.subtitle")}</div></div>
        <button className="btn" onClick={refresh}>{loading ? t("common.loading") : "🔄 " + t("common.refresh")}</button>
      </div>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>{t("stockMovements.newMovement")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 2fr auto", gap: 10, alignItems: "end" }}>
          <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("common.name")}</div>
            <select className="input" value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">{t("stockMovements.selectProduct")}</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name} (Stock: {p.stock})</option>)}
            </select>
          </div>
          <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("common.type")}</div>
            <select className="input" value={reason} onChange={(e) => setReason(e.target.value as any)}>
              <option value="receive">{t("stockMovements.receive")}</option>
              <option value="adjust">{t("stockMovements.adjust")}</option>
            </select>
          </div>
          <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("stockMovements.qtyChange")}</div><input className="input" type="number" value={qtyDelta} onChange={(e) => setQtyDelta(Number(e.target.value))} /></div>
          <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("common.notes")}</div><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("stockMovements.optionalNote")} /></div>
          <button className="btn btnPrimary" onClick={submit}>{t("common.save")}</button>
        </div>
        {selectedProduct && <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>{t("stockMovements.selected")}: <b>{selectedProduct.sku}</b> — {selectedProduct.name} • {t("stockMovements.currentStock")}: {selectedProduct.stock}</div>}
      </div>
      <div className="card">
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>{t("stockMovements.recentMovements")}</div>
        {loading ? <div style={{ padding: 20, color: "var(--muted)" }}>{t("common.loading")}</div> : movements.length === 0 ? <div style={{ padding: 20, color: "var(--muted)" }}>{t("stockMovements.noMovements")}</div> : (
          <table className="table"><thead><tr><th>{t("common.date")}</th><th>{t("common.name")}</th><th>{t("common.type")}</th><th>{t("stockMovements.qtyChange")}</th><th>{t("common.notes")}</th></tr></thead>
            <tbody>{movements.map((m) => { const p = products.find((x) => x.id === m.product_id); return (<tr key={m.id}><td>{new Date(m.created_at).toLocaleString()}</td><td>{p ? `${p.sku} — ${p.name}` : m.product_id.slice(0,8) + "..."}</td><td>{m.reason}</td><td style={{ fontWeight: 700, color: Number(m.qty_delta) >= 0 ? "var(--success)" : "var(--danger)" }}>{Number(m.qty_delta) >= 0 ? "+" : ""}{m.qty_delta}</td><td>{m.note ?? "—"}</td></tr>); })}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
