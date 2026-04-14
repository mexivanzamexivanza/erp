import { useEffect, useRef, useState } from "react";
import { listChannels, createChannel, deleteChannel, listMessages, sendMessage, deleteMessage } from "../lib/erpApi";
import type { MessageChannelRow, MessageRow } from "../lib/erpApi";
import { supabase } from "../lib/supabaseClient";

const TYPE_ICONS:  Record<string,string> = { general:"🌐", department:"👥", direct:"💬" };
const TYPE_COLORS: Record<string,string> = { general:"#2563eb", department:"#7c3aed", direct:"#16a34a" };

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "ahora";
  if (m < 60) return m + "m";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h";
  return Math.floor(h / 24) + "d";
}

export default function Messages() {
  const [channels, setChannels]     = useState<MessageChannelRow[]>([]);
  const [selected, setSelected]     = useState<MessageChannelRow | null>(null);
  const [messages, setMessages]     = useState<MessageRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [body, setBody]             = useState("");
  const [sending, setSending]       = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newName, setNewName]       = useState("");
  const [newDesc, setNewDesc]       = useState("");
  const [newType, setNewType]       = useState("general");
  const [userEmail, setUserEmail]   = useState("");
  const [search, setSearch]         = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? "user@erp.com"));
    loadChannels();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!selected) return;
    // Realtime subscription
    const sub = supabase
      .channel("messages:" + selected.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: "channel_id=eq." + selected.id },
        (payload) => { setMessages(prev => [...prev, payload.new as MessageRow]); })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [selected?.id]);

  async function loadChannels() {
    setLoading(true);
    try { setChannels(await listChannels()); } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  }

  async function selectChannel(ch: MessageChannelRow) {
    setSelected(ch); setMessages([]); setLoadingMsgs(true);
    try { setMessages(await listMessages(ch.id)); } catch (e: any) { alert(e.message); } finally { setLoadingMsgs(false); setTimeout(() => inputRef.current?.focus(), 100); }
  }

  async function handleSend() {
    if (!body.trim() || !selected) return;
    setSending(true);
    try {
      await sendMessage({ channel_id: selected.id, body: body.trim(), sender_email: userEmail, sender_name: userEmail.split("@")[0] });
      setBody("");
    } catch (e: any) { alert(e.message); } finally { setSending(false); }
  }

  async function handleCreateChannel() {
    if (!newName.trim()) return alert("Channel name required");
    try {
      await createChannel({ name: newName, description: newDesc || undefined, type: newType });
      setNewName(""); setNewDesc(""); setNewType("general"); setShowNewChannel(false); await loadChannels();
    } catch (e: any) { alert(e.message); }
  }

  async function handleDeleteChannel(id: string) {
    if (!confirm("Delete this channel and all messages?")) return;
    try { await deleteChannel(id); if (selected?.id === id) { setSelected(null); setMessages([]); } await loadChannels(); }
    catch (e: any) { alert(e.message); }
  }

  async function handleDeleteMessage(id: string) {
    try { await deleteMessage(id); setMessages(prev => prev.filter(m => m.id !== id)); }
    catch (e: any) { alert(e.message); }
  }

  const filteredChannels = channels.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const groupedChannels  = {
    general:    filteredChannels.filter(c => c.type === "general"),
    department: filteredChannels.filter(c => c.type === "department"),
    direct:     filteredChannels.filter(c => c.type === "direct"),
  };

  function getInitials(email: string) {
    return email.split("@")[0].slice(0, 2).toUpperCase();
  }
  function getColor(email: string) {
    const colors = ["#2563eb","#7c3aed","#16a34a","#d97706","#dc2626","#0891b2","#db2777"];
    let hash = 0;
    for (const c of email) hash = (hash * 31 + c.charCodeAt(0)) % colors.length;
    return colors[hash];
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", height: "calc(100vh - 80px)", gap: 0, background: "white", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>

      {/* ── Sidebar ── */}
      <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid var(--border)", background: "#fafafa" }}>
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>💬 Mensajes</div>
            <button className="btn btnPrimary" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => setShowNewChannel(!showNewChannel)}>+ Canal</button>
          </div>
          <input className="input" style={{ fontSize: 12 }} placeholder="🔍 Buscar canal..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {showNewChannel && (
          <div style={{ padding: 14, borderBottom: "1px solid var(--border)", background: "#eff6ff" }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Nuevo Canal</div>
            <input className="input" style={{ marginBottom: 6, fontSize: 12 }} placeholder="Nombre *" value={newName} onChange={e => setNewName(e.target.value)} />
            <input className="input" style={{ marginBottom: 6, fontSize: 12 }} placeholder="Descripción" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
            <select className="input" style={{ marginBottom: 8, fontSize: 12 }} value={newType} onChange={e => setNewType(e.target.value)}>
              <option value="general">🌐 General</option>
              <option value="department">👥 Departamento</option>
              <option value="direct">💬 Directo</option>
            </select>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn" style={{ flex: 1, fontSize: 11 }} onClick={() => setShowNewChannel(false)}>Cancelar</button>
              <button className="btn btnPrimary" style={{ flex: 1, fontSize: 11 }} onClick={handleCreateChannel}>Crear</button>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Cargando...</div>
          ) : (
            <>
              {(["general","department","direct"] as const).map(type => (
                groupedChannels[type].length > 0 && (
                  <div key={type}>
                    <div style={{ padding: "10px 16px 4px", fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>
                      {type === "general" ? "General" : type === "department" ? "Departamentos" : "Directos"}
                    </div>
                    {groupedChannels[type].map(ch => (
                      <div key={ch.id}
                        onClick={() => selectChannel(ch)}
                        style={{ padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, background: selected?.id === ch.id ? "#eff6ff" : "transparent", borderLeft: selected?.id === ch.id ? "3px solid var(--primary)" : "3px solid transparent", transition: "all 0.1s" }}
                        onMouseEnter={e => { if (selected?.id !== ch.id) e.currentTarget.style.background = "#f1f5f9"; }}
                        onMouseLeave={e => { if (selected?.id !== ch.id) e.currentTarget.style.background = "transparent"; }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: TYPE_COLORS[ch.type] + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                          {TYPE_ICONS[ch.type]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: selected?.id === ch.id ? 700 : 500, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch.name}</div>
                          {ch.description && <div style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch.description}</div>}
                        </div>
                        <button onClick={e => { e.stopPropagation(); handleDeleteChannel(ch.id); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 14, opacity: 0, padding: "2px 4px" }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                          onMouseLeave={e => (e.currentTarget.style.opacity = "0")}>✕</button>
                      </div>
                    ))}
                  </div>
                )
              ))}
            </>
          )}
        </div>

        {/* Current user indicator */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, background: "#f8fafc" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: getColor(userEmail), display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            {getInitials(userEmail)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userEmail.split("@")[0]}</div>
            <div style={{ fontSize: 10, color: "#16a34a", fontWeight: 600 }}>● En línea</div>
          </div>
        </div>
      </div>

      {/* ── Chat Area ── */}
      {!selected ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, color: "var(--muted)", background: "#fafafa" }}>
          <div style={{ fontSize: 64 }}>💬</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>Mensajes del Equipo</div>
          <div style={{ fontSize: 14, textAlign: "center", maxWidth: 300 }}>Selecciona un canal para ver los mensajes o crea uno nuevo.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Channel header */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, background: "white" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: TYPE_COLORS[selected.type] + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
              {TYPE_ICONS[selected.type]}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{selected.name}</div>
              {selected.description && <div style={{ fontSize: 12, color: "var(--muted)" }}>{selected.description}</div>}
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{messages.length} mensajes</span>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 4, background: "#fafafa" }}>
            {loadingMsgs ? (
              <div style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>Cargando mensajes...</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
                <div style={{ fontWeight: 600 }}>¡Sé el primero en escribir!</div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => {
                  const isMe = msg.sender_email === userEmail;
                  const showAvatar = i === 0 || messages[i-1].sender_email !== msg.sender_email;
                  return (
                    <div key={msg.id}
                      style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", gap: 8, alignItems: "flex-end", marginTop: showAvatar ? 12 : 2 }}
                      onMouseEnter={e => { const btn = e.currentTarget.querySelector(".del-btn") as HTMLElement; if (btn) btn.style.opacity = "1"; }}
                      onMouseLeave={e => { const btn = e.currentTarget.querySelector(".del-btn") as HTMLElement; if (btn) btn.style.opacity = "0"; }}>
                      {!isMe && showAvatar ? (
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: getColor(msg.sender_email), display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 700, flexShrink: 0, marginBottom: 2 }}>
                          {getInitials(msg.sender_email)}
                        </div>
                      ) : !isMe ? <div style={{ width: 32, flexShrink: 0 }} /> : null}

                      <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                        {showAvatar && !isMe && (
                          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3, fontWeight: 600 }}>
                            {msg.sender_name ?? msg.sender_email.split("@")[0]}
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexDirection: isMe ? "row-reverse" : "row" }}>
                          <div style={{
                            background: isMe ? "var(--primary)" : "white",
                            color: isMe ? "white" : "var(--text)",
                            borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                            padding: "8px 14px",
                            fontSize: 14,
                            lineHeight: 1.5,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                            border: isMe ? "none" : "1px solid var(--border)",
                            wordBreak: "break-word",
                          }}>
                            {msg.body}
                          </div>
                          <button className="del-btn"
                            onClick={() => handleDeleteMessage(msg.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 12, opacity: 0, transition: "opacity 0.1s", padding: "2px 4px", flexShrink: 0 }}>✕</button>
                        </div>
                        <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 3 }}>{timeAgo(msg.created_at)}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", background: "white" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", background: "#f8fafc", borderRadius: 14, padding: "8px 8px 8px 16px", border: "1px solid var(--border)" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: getColor(userEmail), display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                {getInitials(userEmail)}
              </div>
              <input ref={inputRef} style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14 }}
                placeholder={"Escribe un mensaje en #" + selected.name + "..."}
                value={body} onChange={e => setBody(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
              <button className="btn btnPrimary" onClick={handleSend} disabled={sending || !body.trim()}
                style={{ borderRadius: 10, padding: "8px 16px", fontSize: 13, flexShrink: 0 }}>
                {sending ? "⏳" : "Enviar ↵"}
              </button>
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, textAlign: "center" }}>
              Enter para enviar · Los mensajes se sincronizan en tiempo real ⚡
            </div>
          </div>
        </div>
      )}
    </div>
  );
}