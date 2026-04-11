import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { listNotes, addNote, deleteNote } from "../lib/erpApi";
import type { RecordNoteRow } from "../lib/erpApi";

type Props = { entityType: string; entityId: string; authorName?: string };

export default function RecordNotes({ entityType, entityId, authorName }: Props) {
  const { t } = useTranslation();
  const [notes, setNotes]   = useState<RecordNoteRow[]>([]);
  const [text, setText]     = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try { setNotes(await listNotes(entityType, entityId as any)); } catch {}
  }
  useEffect(() => { if (entityId) load(); }, [entityId]);

  async function handleAdd() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await addNote({ entity_type: entityType, entity_id: entityId as any, note: text.trim(), author_name: authorName });
      setText(""); await load();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }
  async function handleDelete(id: string) {
    try { await deleteNote(id as any); await load(); } catch (e: any) { alert(e.message); }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        💬 {t("notes.title")}
        {notes.length > 0 && <span style={{ background: "var(--primary)", color: "white", borderRadius: 10, fontSize: 11, padding: "1px 7px" }}>{notes.length}</span>}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input className="input" style={{ flex: 1 }} placeholder={t("notes.placeholder")} value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAdd(); } }} />
        <button className="btn btnPrimary" onClick={handleAdd} disabled={saving} style={{ whiteSpace: "nowrap" }}>
          {saving ? "..." : t("notes.add")}
        </button>
      </div>
      {notes.length === 0 ? (
        <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: "16px 0" }}>{t("notes.empty")}</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {notes.map(n => (
            <div key={n.id} style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", border: "1px solid var(--border)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, lineHeight: 1.5 }}>{n.note}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                  {n.author_name ? "👤 " + n.author_name + " · " : ""}{new Date(n.created_at).toLocaleString()}
                </div>
              </div>
              <button onClick={() => handleDelete(n.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 16, padding: "0 0 0 8px", lineHeight: 1, flexShrink: 0 }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}