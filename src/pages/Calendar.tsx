import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { listCalendarEvents, createCalendarEvent, deleteCalendarEvent } from "../lib/erpApi";
import type { CalendarEventRow } from "../lib/erpApi";

const TYPE_COLORS: Record<string,string> = { payroll:"#16a34a", project:"#7c3aed", invoice:"#2563eb", po:"#d97706", general:"#0891b2" };

export default function Calendar() {
  const { t, i18n } = useTranslation();
  const now = new Date();
  const [year, setYear]     = useState(now.getFullYear());
  const [month, setMonth]   = useState(now.getMonth() + 1);
  const [events, setEvents] = useState<CalendarEventRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");
  const [title, setTitle]   = useState("");
  const [type, setType]     = useState("general");
  const [desc, setDesc]     = useState("");

  const DAYS_ES   = ["Dom","Lun","Mar","Mie","Jue","Vie","Sab"];
  const DAYS_EN   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS   = i18n.language === "es" ? DAYS_ES   : DAYS_EN;
  const MONTHS = i18n.language === "es" ? MONTHS_ES : MONTHS_EN;

  async function load() { try { setEvents(await listCalendarEvents(year, month)); } catch (e: any) { alert(e.message); } }
  useEffect(() => { load(); }, [year, month]);

  function prevMonth() { if (month === 1) { setMonth(12); setYear(y => y-1); } else setMonth(m => m-1); }
  function nextMonth() { if (month === 12) { setMonth(1); setYear(y => y+1); } else setMonth(m => m+1); }

  const firstDay   = new Date(year, month-1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number|null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i+1)];
  while (cells.length % 7 !== 0) cells.push(null);

  function dayStr(d: number) { return year + "-" + String(month).padStart(2,"0") + "-" + String(d).padStart(2,"0"); }
  function eventsForDay(d: number) { const s = dayStr(d); return events.filter(e => e.start_date === s); }

  async function handleCreate() {
    if (!title.trim() || !selectedDay) return alert(t("calendar.eventTitle") + " required");
    try {
      await createCalendarEvent({ title, description: desc || undefined, type, start_date: selectedDay, color: TYPE_COLORS[type] ?? "#2563eb" });
      setTitle(""); setDesc(""); setType("general"); setShowForm(false); setSelectedDay(""); await load();
    } catch (e: any) { alert(e.message); }
  }
  async function handleDelete(id: string) {
    try { await deleteCalendarEvent(id as any); await load(); } catch (e: any) { alert(e.message); }
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1 className="pageTitle">📅 {t("calendar.title")}</h1><div className="pageSub">{t("calendar.subtitle")}</div></div>
        <button className="btn btnPrimary" onClick={() => { setShowForm(!showForm); if (!selectedDay) setSelectedDay(dayStr(now.getDate())); }}>
          {showForm ? t("common.cancel") : t("calendar.addEvent")}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 14 }}>📅 {t("calendar.newEvent")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("calendar.eventTitle")} *</div><input className="input" value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("calendar.date")} *</div><input className="input" type="date" value={selectedDay} onChange={e => setSelectedDay(e.target.value)} /></div>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("calendar.type")}</div>
              <select className="input" value={type} onChange={e => setType(e.target.value)}>
                {["general","payroll","project","invoice","po"].map(tp => <option key={tp} value={tp}>{t("calendar.types." + tp)}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1/-1" }}><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("common.description")}</div><input className="input" value={desc} onChange={e => setDesc(e.target.value)} /></div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
            <button className="btn" onClick={() => setShowForm(false)}>{t("common.cancel")}</button>
            <button className="btn btnPrimary" onClick={handleCreate}>{t("calendar.addEvent")}</button>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button className="btn" onClick={prevMonth} style={{ fontSize: 18, padding: "4px 14px" }}>‹</button>
          <div style={{ fontWeight: 700, fontSize: 20 }}>{MONTHS[month-1]} {year}</div>
          <button className="btn" onClick={nextMonth} style={{ fontSize: 18, padding: "4px 14px" }}>›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", background: "#f8fafc" }}>
          {DAYS.map(d => <div key={d} style={{ padding: "10px 0", textAlign: "center", fontWeight: 700, fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>{d}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
          {cells.map((day, i) => {
            const isToday = day === now.getDate() && month === now.getMonth()+1 && year === now.getFullYear();
            const dayEvents = day ? eventsForDay(day) : [];
            return (
              <div key={i} onClick={() => { if (day) { setSelectedDay(dayStr(day)); setShowForm(true); } }}
                style={{ minHeight: 96, padding: 8, borderRight: (i+1)%7===0?"none":"1px solid var(--border)", borderBottom: "1px solid var(--border)", cursor: day?"pointer":"default", background: day?"white":"#fafafa" }}
                onMouseEnter={e => { if (day) e.currentTarget.style.background = "#f0f7ff"; }}
                onMouseLeave={e => { if (day) e.currentTarget.style.background = "white"; }}>
                {day && (
                  <>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: isToday?700:400, fontSize: 13, background: isToday?"var(--primary)":"transparent", color: isToday?"white":"var(--text)", marginBottom: 4 }}>{day}</div>
                    {dayEvents.map(ev => (
                      <div key={ev.id} style={{ background: ev.color, color: "white", borderRadius: 5, padding: "2px 6px", fontSize: 10, fontWeight: 600, marginBottom: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 75 }}>{ev.title}</span>
                        <button onClick={e => { e.stopPropagation(); handleDelete(ev.id); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: 12, padding: "0 0 0 4px", lineHeight: 1 }}>✕</button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {events.length > 0 && (
        <div className="card">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>📋 {t("calendar.upcomingEvents")} ({events.length})</div>
          <table className="table">
            <thead><tr><th>{t("calendar.date")}</th><th>{t("calendar.eventTitle")}</th><th>{t("calendar.type")}</th><th>{t("common.description")}</th><th></th></tr></thead>
            <tbody>{events.map(ev => (
              <tr key={ev.id}>
                <td style={{ fontWeight: 600 }}>{ev.start_date}</td>
                <td>{ev.title}</td>
                <td><span style={{ background: ev.color, color: "white", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{t("calendar.types." + ev.type)}</span></td>
                <td style={{ color: "var(--muted)" }}>{ev.description ?? "—"}</td>
                <td><button className="btn btnDanger" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => handleDelete(ev.id)}>✕</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}