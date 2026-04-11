import { printElement } from "../lib/pdfExport";
import RecordNotes from "../components/RecordNotes";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { listPurchaseOrders, listPurchaseOrderLines, receivePurchaseOrder } from "../lib/erpApi";
import type { PurchaseOrderRow, PurchaseOrderLineRow } from "../lib/erpApi";

export default function Receiving() {
  const { t } = useTranslation();
  const [orders, setOrders]           = useState<PurchaseOrderRow[]>([]);
  const [selectedPO, setSelectedPO]   = useState("");
  const [lines, setLines]             = useState<PurchaseOrderLineRow[]>([]);
  const [receiveQtys, setReceiveQtys] = useState<Record<string, number>>({});
  const [loadingLines, setLoadingLines] = useState(false);

  async function refresh() {
    try { setOrders(await listPurchaseOrders()); } catch (e: any) { alert(e.message); }
  }
  useEffect(() => { refresh(); }, []);

  async function loadLines(poId: string) {
    setSelectedPO(poId); setLines([]); setReceiveQtys({});
    if (!poId) return;
    setLoadingLines(true);
    try {
      const ls = await listPurchaseOrderLines(poId);
      setLines(ls);
      const qtys: Record<string, number> = {};
      ls.forEach(l => { qtys[l.id] = Number(l.qty); });
      setReceiveQtys(qtys);
    } catch (e: any) { alert(e.message); } finally { setLoadingLines(false); }
  }

  async function handleReceive(lineId: string) {
    const qty = receiveQtys[lineId] ?? 0;
    if (qty <= 0) return alert(t("receiving.nothingToReceive"));
    try { await receivePurchaseOrder(lineId as any, qty); await loadLines(selectedPO); alert(t("receiving.received2")); }
    catch (e: any) { alert(e.message); }
  }

  async function handleReceiveAll() {
    const toReceive = lines.filter(l => (receiveQtys[l.id] ?? 0) > 0);
    if (toReceive.length === 0) return alert(t("receiving.nothingToReceive"));
    try {
      await Promise.all(toReceive.map(l => receivePurchaseOrder(l.id as any, receiveQtys[l.id])));
      await loadLines(selectedPO); alert(t("receiving.received2"));
    } catch (e: any) { alert(e.message); }
  }

  const selectedOrder = orders.find(o => o.id === selectedPO);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1 className="pageTitle">{t("receiving.title")}</h1><div className="pageSub">{t("receiving.subtitle")}</div></div>
        <button className="btn" onClick={refresh}>🔄 {t("common.refresh")}</button>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>{t("receiving.selectPO")}</div>
        <select className="input" style={{ maxWidth: 480 }} value={selectedPO} onChange={e => loadLines(e.target.value)}>
          <option value="">{t("receiving.selectPOPrompt")}</option>
          {orders.map(o => (
            <option key={o.id} value={o.id}>{o.vendor_name} — {o.status} — {new Date(o.created_at).toLocaleDateString()}</option>
          ))}
        </select>
        {selectedOrder && (
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="badge badge-primary">{t("receiving.selectedPO")}: {selectedOrder.vendor_name}</span>
            <span className={`badge ${selectedOrder.status === "approved" ? "badge-success" : "badge-primary"}`}>{selectedOrder.status}</span>
          </div>
        )}
      </div>

      {selectedPO && (
        <div className="card">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 700 }}>{t("purchaseOrders.poLines")}</div>
            <button className="btn btnPrimary" onClick={handleReceiveAll}>{t("receiving.receive")} {t("common.total")}</button>
          </div>
          {loadingLines ? (
            <div style={{ padding: 20, color: "var(--muted)" }}>{t("receiving.loadingLines")}</div>
          ) : lines.length === 0 ? (
            <div style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>{t("receiving.noLines")}</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>{t("common.name")}</th>
                  <th>{t("receiving.ordered")}</th>
                  <th>{t("receiving.receiveNow")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lines.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontFamily: "monospace", color: "var(--muted)" }}>{l.sku}</td>
                    <td style={{ fontWeight: 600 }}>{l.name}</td>
                    <td>{l.qty}</td>
                    <td>
                      <input className="input" style={{ width: 80 }} type="number" min={0} max={Number(l.qty)}
                        value={receiveQtys[l.id] ?? 0}
                        onChange={e => setReceiveQtys(prev => ({ ...prev, [l.id]: Number(e.target.value) }))} />
                    </td>
                    <td>
                      <button className="btn btnPrimary" style={{ fontSize: 12, padding: "4px 10px" }}
                        onClick={() => handleReceive(l.id)}>
                        {t("receiving.receive")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}