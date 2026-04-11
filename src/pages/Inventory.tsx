import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { listProducts, createProduct, listInventoryMovements, createInventoryMovement } from "../lib/erpApi";
import type { ProductRow, InventoryMovementRow } from "../lib/erpApi";
import { printElement } from "../lib/pdfExport";
import RecordNotes from "../components/RecordNotes";
import BarcodeScanner from "../components/BarcodeScanner";

function money(n: number) { return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(n||0)); }

export default function Inventory() {
  const { t } = useTranslation();
  const [products, setProducts]   = useState<ProductRow[]>([]);
  const [movements, setMovements] = useState<InventoryMovementRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<ProductRow | null>(null);
  const [sku, setSku]             = useState("");
  const [name, setName]           = useState("");
  const [stock, setStock]         = useState<number>(0);
  const [search, setSearch]       = useState("");
  const [saving, setSaving]       = useState(false);
  const [movType, setMovType]     = useState("in");
  const [movQty, setMovQty]       = useState<number>(1);
  const [movNote, setMovNote]     = useState("");
  const [addingMov, setAddingMov] = useState(false);
  const [tab, setTab]             = useState<"products"|"movements">("products");

  async function load() {
    setLoading(true);
    try { const [ps,ms] = await Promise.all([listProducts(), listInventoryMovements()]); setProducts(ps); setMovements(ms); }
    catch (e: any) { alert(e.message); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function handleAdd() {
    if (!sku.trim() || !name.trim()) return alert(t("inventory.skuNameRequired"));
    setSaving(true);
    try { await createProduct({ sku, name, stock }); setSku(""); setName(""); setStock(0); await load(); }
    catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }
  async function handleMovement() {
    if (!selected || movQty <= 0) return alert(t("inventory.qtyRequired"));
    setAddingMov(true);
    try { await createInventoryMovement({ product_id: selected.id, type: movType, qty: movQty, note: movNote||undefined }); setMovQty(1); setMovNote(""); await load(); alert(t("inventory.movementAdded")); }
    catch (e: any) { alert(e.message); } finally { setAddingMov(false); }
  }
  function printStockReport() {
    const rows = products.map(p => `<tr><td>${p.sku}</td><td>${p.name}</td><td style="text-align:center;font-weight:700;color:${Number(p.stock)<=5?"#dc2626":"#16a34a"}">${p.stock}</td><td style="text-align:right">${money(p.price??0)}</td><td style="text-align:right;font-weight:700">${money(Number(p.stock)*Number(p.price??0))}</td></tr>`).join("");
    const total = products.reduce((s,p) => s+Number(p.stock)*Number(p.price??0),0);
    printElement("Reporte de Inventario", `
      <div class="title">Inventario — ${new Date().toLocaleDateString()}</div>
      <div class="info-grid">
        <div class="info-box"><div class="info-label">Total SKUs</div><div class="info-value">${products.length}</div></div>
        <div class="info-box"><div class="info-label">Stock Bajo (≤5)</div><div class="info-value" style="color:#dc2626">${products.filter(p=>Number(p.stock)<=5).length}</div></div>
        <div class="info-box"><div class="info-label">Valor Total</div><div class="info-value" style="color:#16a34a">${money(total)}</div></div>
      </div>
      <table><thead><tr><th>SKU</th><th>Producto</th><th style="text-align:center">Stock</th><th style="text-align:right">Precio</th><th style="text-align:right">Valor</th></tr></thead>
      <tbody>${rows}</tbody>
      <tr class="total-row"><td colspan="4" style="text-align:right;padding:10px 12px">TOTAL</td><td style="text-align:right;padding:10px 12px">${money(total)}</td></tr></table>
    `);
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));
  const lowStock = products.filter(p => Number(p.stock) <= 5).length;
  const totalVal = products.reduce((s,p) => s+Number(p.stock)*Number(p.price??0),0);
  const tabSt = (v: string) => ({ padding:"8px 20px",borderRadius:8,fontWeight:600,fontSize:13,cursor:"pointer",border:"1px solid "+(tab===v?"var(--primary)":"var(--border)"),background:tab===v?"var(--primary)":"white",color:tab===v?"white":"var(--text)" });

  return (
    <div style={{ display:"grid", gap:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div><h1 className="pageTitle">{t("inventory.title")}</h1><div className="pageSub">{t("inventory.subtitle")}</div></div>
        <div style={{ display:"flex", gap:8 }}>
          <BarcodeScanner onSelect={p => setSelected(products.find(x => x.id === p.id) ?? null)} />
          <button className="btn" onClick={printStockReport}>🖨️ PDF</button>
          <button className="btn" onClick={load}>🔄</button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {[
          { label:t("inventory.totalProducts"), value:products.length, color:"#2563eb", icon:"📦" },
          { label:t("inventory.lowStock"),      value:lowStock,        color:"#dc2626", icon:"⚠️" },
          { label:t("inventory.totalValue"),    value:money(totalVal), color:"#16a34a", icon:"💰" },
          { label:t("inventory.movements"),     value:movements.length,color:"#7c3aed", icon:"🔄" },
        ].map((k,i) => (
          <div key={i} className="kpi-card" style={{ borderTop:"3px solid "+k.color }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}><div className="kpi-label">{k.label}</div><span style={{ fontSize:20 }}>{k.icon}</span></div>
            <div className="kpi-value" style={{ color:k.color, fontSize:26, margin:"8px 0" }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding:20 }}>
        <div style={{ fontWeight:700, marginBottom:12 }}>{t("inventory.addProduct")}</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr 1fr auto", gap:10, alignItems:"end" }}>
          <div><div style={{ fontSize:12,color:"var(--muted)",marginBottom:4 }}>SKU *</div><input className="input" value={sku} onChange={e=>setSku(e.target.value)} /></div>
          <div><div style={{ fontSize:12,color:"var(--muted)",marginBottom:4 }}>{t("common.name")} *</div><input className="input" value={name} onChange={e=>setName(e.target.value)} /></div>
          <div><div style={{ fontSize:12,color:"var(--muted)",marginBottom:4 }}>{t("inventory.initialStock")}</div><input className="input" type="number" value={stock} onChange={e=>setStock(Number(e.target.value))} /></div>
          <button className="btn btnPrimary" onClick={handleAdd} disabled={saving}>{saving?"...":t("inventory.addProduct")}</button>
        </div>
      </div>

      <div style={{ display:"flex", gap:8 }}>
        <button style={tabSt("products")}  onClick={()=>setTab("products")}>📦 {t("inventory.products")}</button>
        <button style={tabSt("movements")} onClick={()=>setTab("movements")}>🔄 {t("inventory.movements")}</button>
      </div>

      {tab==="products" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 400px", gap:16, alignItems:"start" }}>
          <div className="card">
            <div style={{ padding:"14px 16px", borderBottom:"1px solid var(--border)" }}>
              <input className="input" placeholder={"🔍 "+t("inventory.search")} value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            {loading ? <div style={{ padding:20,color:"var(--muted)" }}>{t("common.loading")}</div> :
             filtered.length===0 ? <div style={{ padding:24,color:"var(--muted)",textAlign:"center" }}>{t("common.noData")}</div> : (
              <table className="table">
                <thead><tr><th>SKU</th><th>{t("common.name")}</th><th>{t("inventory.stock")}</th><th>{t("inventory.price")}</th><th>{t("inventory.value")}</th></tr></thead>
                <tbody>{filtered.map(p=>(
                  <tr key={p.id} style={{ cursor:"pointer", background:selected?.id===p.id?"var(--primary-light)":Number(p.stock)<=5?"#fef2f2":"white" }}
                    onClick={()=>setSelected(selected?.id===p.id?null:p)}>
                    <td style={{ fontFamily:"monospace",fontSize:12,color:"var(--muted)" }}>{p.sku}</td>
                    <td style={{ fontWeight:600 }}>{p.name}</td>
                    <td><span style={{ fontWeight:700,color:Number(p.stock)<=5?"var(--danger)":Number(p.stock)<=20?"#d97706":"var(--success)" }}>{p.stock}</span>{Number(p.stock)<=5&&<span style={{ marginLeft:6,fontSize:11 }}>⚠️</span>}</td>
                    <td>{money(p.price??0)}</td>
                    <td style={{ fontWeight:600 }}>{money(Number(p.stock)*Number(p.price??0))}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
          <div className="card" style={{ padding:20 }}>
            {!selected ? <div style={{ padding:24,color:"var(--muted)",textAlign:"center" }}>👈 {t("inventory.selectProduct")}</div> : (
              <>
                <div style={{ fontWeight:700,fontSize:16,marginBottom:4 }}>{selected.name}</div>
                <div style={{ fontFamily:"monospace",fontSize:12,color:"var(--muted)",marginBottom:12 }}>{selected.sku}</div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16 }}>
                  <div style={{ background:"#f8fafc",borderRadius:8,padding:12,textAlign:"center" }}>
                    <div style={{ fontSize:11,color:"var(--muted)" }}>{t("inventory.stock")}</div>
                    <div style={{ fontSize:28,fontWeight:800,color:Number(selected.stock)<=5?"var(--danger)":"var(--success)" }}>{selected.stock}</div>
                  </div>
                  <div style={{ background:"#f8fafc",borderRadius:8,padding:12,textAlign:"center" }}>
                    <div style={{ fontSize:11,color:"var(--muted)" }}>{t("inventory.value")}</div>
                    <div style={{ fontSize:20,fontWeight:700,color:"var(--primary)" }}>{money(Number(selected.stock)*Number(selected.price??0))}</div>
                  </div>
                </div>
                <div style={{ fontWeight:700,marginBottom:10 }}>📦 {t("inventory.addMovement")}</div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8 }}>
                  <div><div style={{ fontSize:12,color:"var(--muted)",marginBottom:4 }}>{t("inventory.type")}</div>
                    <select className="input" value={movType} onChange={e=>setMovType(e.target.value)}>
                      <option value="in">📥 {t("inventory.in")}</option>
                      <option value="out">📤 {t("inventory.out")}</option>
                      <option value="adjustment">🔧 {t("inventory.adjustment")}</option>
                    </select>
                  </div>
                  <div><div style={{ fontSize:12,color:"var(--muted)",marginBottom:4 }}>{t("inventory.qty")}</div>
                    <input className="input" type="number" min={1} value={movQty} onChange={e=>setMovQty(Number(e.target.value))} />
                  </div>
                </div>
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:12,color:"var(--muted)",marginBottom:4 }}>{t("common.notes")}</div>
                  <input className="input" value={movNote} onChange={e=>setMovNote(e.target.value)} />
                </div>
                <button className="btn btnPrimary" style={{ width:"100%",justifyContent:"center",marginBottom:16 }} onClick={handleMovement} disabled={addingMov}>
                  {addingMov?"...":t("inventory.addMovement")}
                </button>
                <RecordNotes entityType="product" entityId={selected.id} authorName="ERP User" />
              </>
            )}
          </div>
        </div>
      )}

      {tab==="movements" && (
        <div className="card">
          <div style={{ padding:"14px 16px",borderBottom:"1px solid var(--border)",fontWeight:700 }}>🔄 {t("inventory.recentMovements")} ({movements.length})</div>
          {movements.length===0 ? <div style={{ padding:24,color:"var(--muted)",textAlign:"center" }}>{t("common.noData")}</div> : (
            <table className="table">
              <thead><tr><th>SKU</th><th>{t("common.name")}</th><th>{t("inventory.type")}</th><th>{t("inventory.qty")}</th><th>{t("common.date")}</th><th>{t("common.notes")}</th></tr></thead>
              <tbody>{movements.map(m=>(
                <tr key={m.id}>
                  <td style={{ fontFamily:"monospace",color:"var(--muted)" }}>{m.sku}</td>
                  <td style={{ fontWeight:600 }}>{m.product_name}</td>
                  <td><span className={`badge ${m.type==="in"?"badge-success":m.type==="out"?"badge-danger":"badge-warning"}`}>{m.type}</span></td>
                  <td style={{ fontWeight:700 }}>{m.qty}</td>
                  <td style={{ color:"var(--muted)",fontSize:12 }}>{new Date(m.created_at).toLocaleString()}</td>
                  <td style={{ color:"var(--muted)" }}>{m.note??"—"}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}