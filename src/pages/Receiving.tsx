import { useEffect, useMemo, useState } from "react";
import { listPurchaseOrderLines, listPurchaseOrders, receivePurchaseOrder } from "../lib/erpApi";
import type { PurchaseOrderLineRow, PurchaseOrderRow } from "../lib/erpApi";

type LineDraft = {
  id: string;
  receive_qty: number;
};

export default function Receiving() {
  console.log("DEBUG Receiving", {
    pos_type: typeof pos,
    pos_isArray: Array.isArray(pos),
    lines_type: typeof lines,
    lines_isArray: Array.isArray(lines),
    draft_type: typeof draft,
    draft_isObject: draft && typeof draft === "object",
  });
  const [pos, setPos] = useState<PurchaseOrderRow[]>([]);
  const [loadingPOs, setLoadingPOs] = useState(true);

  const [poId, setPoId] = useState("");
  const [lines, setLines] = useState<PurchaseOrderLineRow[]>([]);
  const [loadingLines, setLoadingLines] = useState(false);

  const [draft, setDraft] = useState<Record<string, LineDraft>>({});
  const [saving, setSaving] = useState(false);

  const selectedPO = useMemo(() => pos.find((p) => p.id === poId) ?? null, [pos, poId]);

  async function refreshPOs() {
    setLoadingPOs(true);
    try {
      // show only not-fully-received by default (we’ll still allow selecting any)
      const all = await listPurchaseOrders();
      setPos(all);
    } catch (e: any) {
      alert(e.message ?? String(e));
    } finally {
      setLoadingPOs(false);
    }
  }

  async function loadLines(id: string) {
    setLoadingLines(true);
    try {
      const ls = await listPurchaseOrderLines(id);
      setLines(ls);

      // init draft qty to remaining
      const next: Record<string, LineDraft> = {};
      for (const l of ls) {
        const ordered = Number(l.qty);
        const received = Number((l as any).received_qty ?? 0);
        const remaining = Math.max(0, ordered - received);
        next[l.id] = { id: l.id, receive_qty: remaining > 0 ? remaining : 0 };
      }
      setDraft(next);
    } catch (e: any) {
      alert(e.message ?? String(e));
    } finally {
      setLoadingLines(false);
    }
  }

  useEffect(() => {
    refreshPOs();
  }, []);

  useEffect(() => {
    if (!poId) return;
    loadLines(poId);
  }, [poId]);

  async function submit() {
    if (!poId) return alert("Pick a PO.");
    const payload = Object.values(draft)
      .filter((d) => Number(d.receive_qty) > 0)
      .map((d) => ({ po_line_id: d.id, receive_qty: Number(d.receive_qty) }));

    if (payload.length === 0) return alert("Nothing to receive (all qty are 0).");

    setSaving(true);
    try {
      await receivePurchaseOrder({ po_id: poId, lines: payload });
      await refreshPOs();
      await loadLines(poId);
      alert("Received.");
    } catch (e: any) {
      alert(e.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <h1 className="pageTitle">Receiving</h1>
          <div className="pageSub">Receive items from purchase orders and increase stock.</div>
        </div>
        <button className="btn" onClick={refreshPOs}>{loadingPOs ? "Loading..." : "Refresh"}</button>
      </div>

      <section className="card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Select purchase order</div>

        <select className="input" value={poId} onChange={(e) => setPoId(e.target.value)}>
          <option value="">Select PO...</option>
          {(pos ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.vendor_name} — {p.status} — {new Date(p.created_at).toLocaleString()}
            </option>
          ))}
        </select>

        {selectedPO && (
          <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 12 }}>
            Selected PO: <b>{selectedPO.vendor_name}</b> • Status: {selectedPO.status}
          </div>
        )}
      </section>

      <section className="card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Lines</div>

        {!poId ? (
          <div style={{ color: "var(--muted)" }}>Pick a PO to load lines.</div>
        ) : loadingLines ? (
          <div style={{ color: "var(--muted)" }}>Loading lines...</div>
        ) : lines.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>No lines.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Ordered</th>
                  <th>Received</th>
                  <th>Remaining</th>
                  <th>Receive now</th>
                </tr>
              </thead>
              <tbody>
                {(lines ?? []).map((l) => {
                  const ordered = Number(l.qty);
                  const received = Number((l as any).received_qty ?? 0);
                  const remaining = Math.max(0, ordered - received);
                  return (
                    <tr key={l.id}>
                      <td>{l.sku}</td>
                      <td>{l.name}</td>
                      <td>{ordered}</td>
                      <td>{received}</td>
                      <td>{remaining}</td>
                      <td style={{ width: 180 }}>
                        <input
                          className="input"
                          type="number"
                          value={draft[l.id]?.receive_qty ?? 0}
                          min={0}
                          max={remaining}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              [l.id]: { id: l.id, receive_qty: Number(e.target.value) },
                            }))
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button className="btn btnPrimary" onClick={submit} disabled={saving}>
                {saving ? "Saving..." : "Receive"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}




