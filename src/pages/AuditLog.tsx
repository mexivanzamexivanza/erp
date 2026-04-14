import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { listAuditLog } from "../lib/erpApi";
import type { AuditLogRow } from "../lib/erpApi";

export default function AuditLog() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  async function refresh() { setLoading(true); try { setRows(await listAuditLog(200)); } catch (e: any) { alert(e.message); } finally { setLoading(false); } }
  useEffect(() => { refresh(); }, []);
  const filtered = useMemo(() => { const s = q.trim().toLowerCase(); if (!s) return rows; return rows.filter((r) => [r.action, r.entity_type, r.entity_id ?? "", JSON.stringify(r.metadata ?? {})].some((x) => String(x).toLowerCase().includes(s))); }, [rows, q]);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1 className="pageTitle">{t("auditLog.title")}</h1><div className="pageSub">{t("auditLog.subtitle")}</div></div>
        <button className="btn" onClick={refresh}>{loading ? t("common.loading") : "🔄 " + t("common.refresh")}</button>
      </div>
      <div className="card">
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700 }}>{t("auditLog.latestEvents")}</div>
          <input className="input" style={{ width: 300 }} placeholder={t("common.search") + "..."} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {loading ? <div style={{ padding: 20, color: "var(--muted)" }}>{t("common.loading")}</div> : filtered.length === 0 ? <div style={{ padding: 20, color: "var(--muted)" }}>{t("common.noData")}</div> : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead><tr><th>{t("common.date")}</th><th>{t("auditLog.action")}</th><th>{t("auditLog.entity")}</th><th>ID</th><th>{t("auditLog.actor")}</th><th>{t("auditLog.metadata")}</th></tr></thead>
              <tbody>{filtered.map((r) => (<tr key={r.id}>
                <td>{new Date(r.created_at).toLocaleString()}</td>
                <td style={{ fontWeight: 700 }}>{r.action}</td>
                <td>{r.entity_type}</td>
                <td style={{ fontFamily: "monospace", fontSize: 11 }}>{r.entity_id ?? ""}</td>
                <td style={{ fontFamily: "monospace", fontSize: 11 }}>{r.actor_user_id ?? ""}</td>
                <td style={{ fontFamily: "monospace", fontSize: 11, whiteSpace: "pre-wrap" }}>{JSON.stringify(r.metadata ?? {}, null, 2)}</td>
              </tr>))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
