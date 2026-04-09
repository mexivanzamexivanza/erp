import { useEffect, useMemo, useState } from "react";
import { listAuditLog } from "../lib/erpApi";
import type { AuditLogRow } from "../lib/erpApi";

export default function AuditLog() {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      setRows(await listAuditLog(200));
    } catch (e: any) {
      // If user isn't admin/manager, RLS will block with a permission error.
      alert(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      [
        r.action,
        r.entity_type,
        r.entity_id ?? "",
        JSON.stringify(r.metadata ?? {}),
      ].some((x) => String(x).toLowerCase().includes(s))
    );
  }, [rows, q]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <h1 className="pageTitle">Audit log</h1>
          <div className="pageSub">Admin/Manager only. Tracks ERP actions (sales, inventory, POs, invoices, payments).</div>
        </div>
        <button className="btn" onClick={refresh}>{loading ? "Loading..." : "Refresh"}</button>
      </div>

      <section className="card" style={{ padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 800 }}>Latest events</div>
          <input
            className="input"
            style={{ width: 320 }}
            placeholder="Filter (action/entity/id/metadata)..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          {loading ? (
            <div style={{ color: "var(--muted)" }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ color: "var(--muted)" }}>No events (or access denied).</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Entity ID</th>
                    <th>Actor</th>
                    <th>Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td>{new Date(r.created_at).toLocaleString()}</td>
                      <td style={{ fontWeight: 800 }}>{r.action}</td>
                      <td>{r.entity_type}</td>
                      <td style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 12 }}>
                        {r.entity_id ?? ""}
                      </td>
                      <td style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 12 }}>
                        {r.actor_user_id ?? ""}
                      </td>
                      <td style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 12, whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(r.metadata ?? {}, null, 2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
