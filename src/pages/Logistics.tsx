import { printElement } from "../lib/pdfExport";
import RecordNotes from "../components/RecordNotes";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { listShipments, createShipment, updateShipmentStatus, deleteShipment } from "../lib/erpApi";
import type { ShipmentRow } from "../lib/erpApi";

const STATUS_COLORS: Record<string,string> = { pending:"badge-primary", in_transit:"badge-warning", delivered:"badge-success", cancelled:"badge-danger" };
const TYPE_COLORS:   Record<string,string> = { outbound:"badge-primary", inbound:"badge-success" };

export default function Logistics() {
  const { t } = useTranslation();
  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [selected, setSelected]   = useState<ShipmentRow | null>(null);
  const [filter, setFilter]       = useState("all");

  const [ref, setRef]             = useState("");
  const [type, setType]           = useState("outbound");
  const [carrier, setCarrier]     = useState("");
  const [tracking, setTracking]   = useState("");
  const [origin, setOrigin]       = useState("");
  const [dest, setDest]           = useState("");
  const [shipDate, setShipDate]   = useState("");
  const [estDelivery, setEstDelivery] = useState("");
  const [notes, setNotes]         = useState("");

  async function refresh() { setLoading(true); try { setShipments(await listShipments()); } catch (e: any) { alert(e.message); } finally { setLoading(false); } }
  useEffect(() => { refresh(); }, []);

  async function handleCreate() {
    if (!ref.trim()) return alert(t("logistics.refRequired"));
    setSaving(true);
    try { await createShipment({ reference: ref, type, carrier: carrier || undefined, tracking_number: tracking || undefined, origin: origin || undefined, destination: dest || undefined, ship_date: shipDate || undefined, estimated_delivery: estDelivery || undefined, notes: notes || undefined }); setRef(""); setCarrier(""); setTracking(""); setOrigin(""); setDest(""); setShipDate(""); setEstDelivery(""); setNotes(""); setType("outbound"); setShowForm(false); await refresh(); }
    catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }

  async function handleStatus(id: string, status: string) { try { await updateShipmentStatus(id, status); await refresh(); if (selected?.id === id) setSelected(s => s ? { ...s, status } : s); } catch (e: any) { alert(e.message); } }
  async function handleDelete(id: string) { if (!confirm(t("common.confirm"))) return; try { await deleteShipment(id); if (selected?.id === id) setSelected(null); await refresh(); } catch (e: any) { alert(e.message); } }

  const filtered = filter === "all" ? shipments : shipments.filter(s => s.status === filter || s.type === filter);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1 className="pageTitle">{t("logistics.title")}</h1><div className="pageSub">{t("logistics.subtitle")}</div></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={refresh}>🔄 {t("common.refresh")}</button>
          <button className="btn btnPrimary" onClick={() => setShowForm(!showForm)}>{showForm ? t("common.cancel") : t("logistics.newShipment")}</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: t("logistics.total"),      value: shipments.length,                                         color: "var(--primary)" },
          { label: t("logistics.inTransit"),  value: shipments.filter(s => s.status === "in_transit").length,  color: "var(--warning)" },
          { label: t("logistics.delivered"),  value: shipments.filter(s => s.status === "delivered").length,   color: "var(--success)" },
          { label: t("logistics.pending"),    value: shipments.filter(s => s.status === "pending").length,     color: "var(--muted)" },
        ].map(k => <div key={k.label} className="kpi-card"><div className="kpi-label">{k.label}</div><div className="kpi-value" style={{ fontSize: 28, color: k.color }}>{k.value}</div></div>)}
      </div>

      {showForm && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>{t("logistics.newShipment")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("logistics.reference")} *</div><input className="input" placeholder="SHP-001" value={ref} onChange={e => setRef(e.target.value)} /></div>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("logistics.type")}</div>
              <select className="input" value={type} onChange={e => setType(e.target.value)}>
                <option value="outbound">{t("logistics.outbound")}</option>
                <option value="inbound">{t("logistics.inbound")}</option>
              </select>
            </div>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("logistics.carrier")}</div><input className="input" placeholder="FedEx, UPS, DHL..." value={carrier} onChange={e => setCarrier(e.target.value)} /></div>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("logistics.trackingNumber")}</div><input className="input" value={tracking} onChange={e => setTracking(e.target.value)} /></div>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("logistics.origin")}</div><input className="input" value={origin} onChange={e => setOrigin(e.target.value)} /></div>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("logistics.destination")}</div><input className="input" value={dest} onChange={e => setDest(e.target.value)} /></div>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("logistics.shipDate")}</div><input className="input" type="date" value={shipDate} onChange={e => setShipDate(e.target.value)} /></div>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("logistics.estDelivery")}</div><input className="input" type="date" value={estDelivery} onChange={e => setEstDelivery(e.target.value)} /></div>
            <div style={{ gridColumn: "1/-1" }}><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("common.notes")}</div><input className="input" value={notes} onChange={e => setNotes(e.target.value)} /></div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <button className="btn" onClick={() => setShowForm(false)}>{t("common.cancel")}</button>
            <button className="btn btnPrimary" onClick={handleCreate} disabled={saving}>{saving ? t("common.saving") : t("logistics.createShipment")}</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["all","pending","in_transit","delivered","outbound","inbound"].map(f => (
          <button key={f} className={`btn ${filter === f ? "btnPrimary" : ""}`} style={{ fontSize: 12 }} onClick={() => setFilter(f)}>
            {f === "all" ? t("logistics.all") : t(`logistics.${f.replace("_","")}`)}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16, alignItems: "start" }}>
        <div className="card">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>{t("logistics.shipments")} ({filtered.length})</div>
          {loading ? <div style={{ padding: 20, color: "var(--muted)" }}>{t("common.loading")}</div> : filtered.length === 0 ? <div style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>{t("logistics.noShipments")}</div> : (
            <table className="table">
              <thead><tr><th>{t("logistics.reference")}</th><th>{t("logistics.type")}</th><th>{t("common.status")}</th><th>{t("logistics.carrier")}</th><th>{t("logistics.origin")}</th><th>{t("logistics.destination")}</th><th>{t("logistics.shipDate")}</th><th>{t("logistics.estDelivery")}</th><th></th></tr></thead>
              <tbody>{filtered.map(s => (
                <tr key={s.id} style={{ cursor: "pointer", background: selected?.id === s.id ? "var(--primary-light)" : "white" }} onClick={() => setSelected(s)}>
                  <td style={{ fontWeight: 700 }}>{s.reference}</td>
                  <td><span className={`badge ${TYPE_COLORS[s.type]}`}>{t(`logistics.${s.type}`)}</span></td>
                  <td><span className={`badge ${STATUS_COLORS[s.status]}`}>{t(`logistics.statuses.${s.status}`)}</span></td>
                  <td>{s.carrier ?? "—"}</td>
                  <td>{s.origin ?? "—"}</td>
                  <td>{s.destination ?? "—"}</td>
                  <td>{s.ship_date ?? "—"}</td>
                  <td>{s.estimated_delivery ?? "—"}</td>
                  <td><button className="btn btnDanger" style={{ padding: "4px 8px", fontSize: 12 }} onClick={e => { e.stopPropagation(); handleDelete(s.id); }}>🗑</button></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>

        <div className="card">
          {!selected ? <div style={{ padding: 40, color: "var(--muted)", textAlign: "center" }}>👈 {t("logistics.selectShipment")}</div> : (
            <>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{selected.reference}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{selected.type} · {selected.carrier ?? t("logistics.noCarrier")}</div>
              </div>
              <div style={{ padding: 16, display: "grid", gap: 8, fontSize: 13 }}>
                {[
                  { label: t("common.status"),        value: <span className={`badge ${STATUS_COLORS[selected.status]}`}>{t(`logistics.statuses.${selected.status}`)}</span> },
                  { label: t("logistics.trackingNumber"), value: selected.tracking_number ?? "—" },
                  { label: t("logistics.origin"),     value: selected.origin ?? "—" },
                  { label: t("logistics.destination"), value: selected.destination ?? "—" },
                  { label: t("logistics.shipDate"),   value: selected.ship_date ?? "—" },
                  { label: t("logistics.estDelivery"), value: selected.estimated_delivery ?? "—" },
                  { label: t("logistics.actualDelivery"), value: selected.actual_delivery ?? "—" },
                  { label: t("common.notes"),         value: selected.notes ?? "—" },
                ].map(row => <div key={row.label} style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--muted)" }}>{row.label}</span><span style={{ fontWeight: 500 }}>{row.value}</span></div>)}
              </div>
              <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, flexWrap: "wrap" }}>
                {selected.status === "pending"    && <button className="btn btnPrimary" style={{ fontSize: 12 }} onClick={() => handleStatus(selected.id, "in_transit")}>🚚 {t("logistics.markInTransit")}</button>}
                {selected.status === "in_transit" && <button className="btn btnSuccess" style={{ fontSize: 12 }} onClick={() => handleStatus(selected.id, "delivered")}>✅ {t("logistics.markDelivered")}</button>}
                {selected.status !== "delivered" && selected.status !== "cancelled" && <button className="btn btnDanger" style={{ fontSize: 12 }} onClick={() => handleStatus(selected.id, "cancelled")}>✕ {t("logistics.cancel")}</button>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
