import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { listNotifications, markNotificationRead, markAllNotificationsRead, generateSystemNotifications } from "../lib/erpApi";
import type { NotificationRow } from "../lib/erpApi";


export default function NotificationBell() {
  const { t } = useTranslation();
  const [open, setOpen]     = useState(false);
  const [notifs, setNotifs] = useState<NotificationRow[]>([]);
  const navigate = useNavigate();
  const unread = notifs.filter(n => !n.read).length;

  async function load() { try { setNotifs(await listNotifications()); } catch {} }

  useEffect(() => { load(); const id = setInterval(load, 30000); return () => clearInterval(id); }, []);

  async function handleRead(n: NotificationRow) {
    await markNotificationRead(n.id as any);
    if (n.link) { navigate(n.link); setOpen(false); }
    await load();
  }
  async function handleMarkAll() { await markAllNotificationsRead(); await load(); }
  async function handleGenerate() {
    try { const count = await generateSystemNotifications(); await load(); alert(count + " " + t("notifications.generated")); }
    catch (e: any) { alert(e.message); }
  }

  const typeEmoji: Record<string,string> = { low_stock:"⚠️", overdue_invoice:"🧾", pending_approval:"✅", payroll:"💰", info:"ℹ️" };

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", fontSize: 22, padding: "4px 8px", lineHeight: 1 }}>
        🔔
        {unread > 0 && (
          <span style={{ position: "absolute", top: 0, right: 0, background: "#dc2626", color: "white", borderRadius: "50%", fontSize: 10, fontWeight: 700, minWidth: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
          <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 380, background: "white", borderRadius: 14, boxShadow: "0 10px 40px rgba(0,0,0,0.15)", border: "1px solid var(--border)", zIndex: 100, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                🔔 {t("notifications.title")}
                {unread > 0 && <span style={{ background: "#dc2626", color: "white", borderRadius: 10, fontSize: 11, padding: "1px 7px", fontWeight: 700 }}>{unread}</span>}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn" style={{ fontSize: 11, padding: "3px 8px" }} onClick={handleGenerate}>🔍 {t("notifications.scan")}</button>
                {unread > 0 && <button className="btn" style={{ fontSize: 11, padding: "3px 8px" }} onClick={handleMarkAll}>✓ {t("notifications.markAll")}</button>}
              </div>
            </div>
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {notifs.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>🔕 {t("notifications.empty")}</div>
              ) : notifs.map(n => (
                <div key={n.id} onClick={() => handleRead(n)}
                  style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: n.read ? "white" : "#eff6ff", display: "flex", gap: 12, alignItems: "flex-start", transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = n.read ? "white" : "#eff6ff")}>
                  <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{typeEmoji[n.type] ?? "ℹ️"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: n.read ? 500 : 700, fontSize: 13, marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>{n.message}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                  {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", flexShrink: 0, marginTop: 6 }} />}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}