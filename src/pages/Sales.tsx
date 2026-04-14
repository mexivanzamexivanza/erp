import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { createSalesOrder, listCustomers, listProducts, listSalesOrders } from "../lib/erpApi";
import type { CustomerRow, ProductRow, SalesOrderRow } from "../lib/erpApi";
import { printElement } from "../lib/pdfExport";
import RecordNotes from "../components/RecordNotes";
import BarcodeScanner from "../components/BarcodeScanner";

type DraftLine = { id: string; product_id: string; sku: string; name: string; qty: number; price: number };
function uid() { return "id_" + Math.random().toString(16).slice(2) + "_" + Date.now(); }
function money(n: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0)); }

export default function Sales() {
  const { t } = useTranslation();
  const [customers, setCustomers]   = useState<CustomerRow[]>([]);
  const [products, setProducts]     = useState<ProductRow[]>([]);
  const [orders, setOrders]         = useState<SalesOrderRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId]   = useState("");
  const [qty, setQty]               = useState<number>(1);
  const [price, setPrice]           = useState<number>(0);
  const [draftLines, setDraftLines] = useState<DraftLine[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderRow | null>(null);
  const draftTotal = useMemo(() => draftLines.reduce((s, l) => s + l.qty * l.price, 0), [draftLines]);
  const selectedProduct = useMemo(() => products.find(p => p.id === productId) ?? null, [products, productId]);

  async function refresh() {
    setLoading(true);
    try {
      const [cs, ps, os] = await Promise.all([listCustomers(), listProducts(), listSalesOrders()]);
      setCustomers(cs); setProducts(ps); setOrders(os);
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);
  useEffect(() => { if (selectedProduct) setPrice(Number(selectedProduct.price ?? 0)); }, [selectedProduct]);

  function addLine() {
    if (!selectedProduct) return alert(t("sales.pickProduct"));
    setDraftLines(prev => [...prev, { id: uid(), product_id: selectedProduct.id, sku: selectedProduct.sku, name: selectedProduct.name, qty: Number(qty), price: Number(price) }]);
    setProductId(""); setQty(1); setPrice(0);
  }
  function removeLine(id: string) { setDraftLines(prev => prev.filter(l => l.id !== id)); }

  async function createOrder() {
    if (!customerId) return alert(t("sales.pickCustomer"));
    if (draftLines.length === 0) return alert(t("sales.addOneLine"));
    try {
      await createSalesOrder({ customer_id: customerId, customer_name: customers.find(c => c.id === customerId)?.name ?? "", lines: draftLines.map(l => ({ product_id: l.product_id, qty: l.qty, price: l.price })) });
      setCustomerId(""); setDraftLines([]); await refresh(); alert(t("sales.created"));
    } catch (e: any) { alert(e.message); }
  }

  function printOrder(o: SalesOrderRow) {
    printElement("Orden de Venta — " + o.customer_name, `
      <div class="title">Orden de Venta</div>
      <div class="info-grid">
        <div class="info-box"><div class="info-label">Cliente</div><div class="info-value">${o.customer_name}</div></div>
        <div class="info-box"><div class="info-label">Estado</div><div class="info-value">${o.status}</div></div>
        <div class="info-box"><div class="info-label">Total</div><div class="info-value">$${Number(o.total ?? 0).toFixed(2)}</div></div>
        <div class="info-box"><div class="info-label">Fecha</div><div class="info-value">${new Date(o.created_at).toLocaleDateString()}</div></div>
      </div>
    `);
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1 className="pageTitle">{t("sales.title")}</h1><div className="pageSub">{t("sales.subtitle")}</div></div>
        <span className="badge">{t("sales.draftTotal")}: {money(draftTotal)}</span>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>{t("sales.newOrder")}</div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("sales.customer")}</div>
          <select className="input" value={customerId} onChange={e => setCustomerId(e.target.value)}>
            <option value="">{loading ? t("common.loading") : t("sales.selectCustomer")}</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <hr className="sep" />
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto auto", gap: 10, alignItems: "end", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("sales.product")}</div>
            <select className="input" value={productId} onChange={e => setProductId(e.target.value)}>
              <option value="">{t("sales.selectProduct")}</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name} ({t("sales.stock")}: {p.stock})</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("sales.qty")}</div>
            <input className="input" type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value))} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("sales.unitPrice")}</div>
            <input className="input" type="number" min={0} step="0.01" value={price} onChange={e => setPrice(Number(e.target.value))} />
          </div>
          <button className="btn" onClick={addLine}>{t("sales.addLine")}</button>
          <BarcodeScanner onSelect={p => { setProductId(p.id); setPrice(p.price); }} />
        </div>

        {draftLines.length > 0 && (
          <>
            <table className="table" style={{ marginBottom: 12 }}>
              <thead><tr><th>SKU</th><th>{t("common.name")}</th><th>{t("sales.qty")}</th><th>{t("sales.unitPrice")}</th><th>{t("common.total")}</th><th></th></tr></thead>
              <tbody>
                {draftLines.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontFamily: "monospace", color: "var(--muted)" }}>{l.sku}</td>
                    <td style={{ fontWeight: 600 }}>{l.name}</td>
                    <td>{l.qty}</td>
                    <td>{money(l.price)}</td>
                    <td style={{ fontWeight: 700 }}>{money(l.qty * l.price)}</td>
                    <td><button className="btn btnDanger" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => removeLine(l.id)}>{t("sales.remove")}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button className="btn" onClick={() => setDraftLines([])}>{t("sales.clearDraft")}</button>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{t("sales.draftTotal")}: {money(draftTotal)}</span>
                <button className="btn btnPrimary" onClick={createOrder}>{t("sales.createOrder")}</button>
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 16, alignItems: "start" }}>
        <div className="card">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 700 }}>{t("sales.recentOrders")}</div>
            <button className="btn" onClick={refresh}>{loading ? t("common.loading") : t("common.refresh")}</button>
          </div>
          {loading ? (
            <div style={{ padding: 20, color: "var(--muted)" }}>{t("common.loading")}</div>
          ) : orders.length === 0 ? (
            <div style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>{t("sales.noOrders")}</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t("sales.customer")}</th>
                  <th>{t("common.status")}</th>
                  <th>{t("common.date")}</th>
                  <th>{t("common.total")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} style={{ cursor: "pointer", background: selectedOrder?.id === o.id ? "var(--primary-light)" : "white" }}
                    onClick={() => setSelectedOrder(o)}>
                    <td style={{ fontWeight: 600 }}>{o.customer_name}</td>
                    <td><span className={`badge ${o.status === "confirmed" ? "badge-success" : o.status === "cancelled" ? "badge-danger" : "badge-primary"}`}>{o.status}</span></td>
                    <td style={{ color: "var(--muted)", fontSize: 12 }}>{new Date(o.created_at).toLocaleString()}</td>
                    <td style={{ fontWeight: 700 }}>{money(o.total ?? 0)}</td>
                    <td><button className="btn" style={{ fontSize: 11, padding: "3px 8px" }} onClick={e => { e.stopPropagation(); printOrder(o); }}>🖨️</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card" style={{ padding: 20 }}>
          {!selectedOrder ? (
            <div style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>👈 {t("sales.selectOrder", "Select an order to add notes")}</div>
          ) : (
            <>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{selectedOrder.customer_name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>{new Date(selectedOrder.created_at).toLocaleString()}</div>
              <RecordNotes entityType="sales_order" entityId={selectedOrder.id} authorName="ERP User" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
