import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { listProjects, createProject, updateProjectStatus, deleteProject, listProjectTasks, createProjectTask, updateTaskStatus, deleteTask } from "../lib/erpApi";
import type { ProjectRow, ProjectTaskRow } from "../lib/erpApi";

const STATUS_COLORS: Record<string,string>   = { active:"badge-success", completed:"badge-primary", on_hold:"badge-warning", cancelled:"badge-danger" };
const TASK_COLORS: Record<string,string>     = { todo:"badge", in_progress:"badge-warning", review:"badge-primary", done:"badge-success" };
const PRIORITY_COLORS: Record<string,string> = { low:"badge", medium:"badge-primary", high:"badge-warning", critical:"badge-danger" };

function money(n: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n); }

export default function Projects() {
  const { t } = useTranslation();
  const [projects, setProjects]   = useState<ProjectRow[]>([]);
  const [tasks, setTasks]         = useState<ProjectTaskRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<ProjectRow | null>(null);
  const [showForm, setShowForm]   = useState(false);
  const [showTask, setShowTask]   = useState(false);
  const [saving, setSaving]       = useState(false);

  const [pName, setPName]         = useState("");
  const [pDesc, setPDesc]         = useState("");
  const [pPriority, setPPriority] = useState("medium");
  const [pStart, setPStart]       = useState("");
  const [pDue, setPDue]           = useState("");
  const [pBudget, setPBudget]     = useState("");

  const [tTitle, setTTitle]       = useState("");
  const [tPriority, setTPriority] = useState("medium");
  const [tAssignee, setTAssignee] = useState("");
  const [tDue, setTDue]           = useState("");

  async function refresh() { setLoading(true); try { setProjects(await listProjects()); } catch (e: any) { alert(e.message); } finally { setLoading(false); } }
  async function loadTasks(p: ProjectRow) { setSelected(p); try { setTasks(await listProjectTasks(p.id)); } catch (e: any) { alert(e.message); } }
  useEffect(() => { refresh(); }, []);

  async function handleCreateProject() {
    if (!pName.trim()) return alert(t("projects.nameRequired"));
    setSaving(true);
    try { await createProject({ name: pName, description: pDesc, priority: pPriority, start_date: pStart || undefined, due_date: pDue || undefined, budget: Number(pBudget) }); setPName(""); setPDesc(""); setPPriority("medium"); setPStart(""); setPDue(""); setPBudget(""); setShowForm(false); await refresh(); }
    catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }

  async function handleCreateTask() {
    if (!selected || !tTitle.trim()) return alert(t("projects.taskTitleRequired"));
    try { await createProjectTask({ project_id: selected.id, title: tTitle, priority: tPriority, assignee_name: tAssignee || undefined, due_date: tDue || undefined }); setTTitle(""); setTAssignee(""); setTPriority("medium"); setTDue(""); setShowTask(false); await loadTasks(selected); }
    catch (e: any) { alert(e.message); }
  }

  async function handleTaskStatus(id: string, status: string) { try { await updateTaskStatus(id, status); if (selected) await loadTasks(selected); } catch (e: any) { alert(e.message); } }
  async function handleDeleteTask(id: string) { if (!confirm(t("common.confirm"))) return; try { await deleteTask(id); if (selected) await loadTasks(selected); } catch (e: any) { alert(e.message); } }
  async function handleDeleteProject(id: string) { if (!confirm(t("common.confirm"))) return; try { await deleteProject(id); if (selected?.id === id) { setSelected(null); setTasks([]); } await refresh(); } catch (e: any) { alert(e.message); } }
  async function handleProjectStatus(id: string, status: string) { try { await updateProjectStatus(id, status); await refresh(); if (selected?.id === id) setSelected(p => p ? { ...p, status } : p); } catch (e: any) { alert(e.message); } }

  const tasksByStatus = ["todo","in_progress","review","done"].reduce((acc, s) => { acc[s] = tasks.filter(t2 => t2.status === s); return acc; }, {} as Record<string,ProjectTaskRow[]>);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1 className="pageTitle">{t("projects.title")}</h1><div className="pageSub">{t("projects.subtitle")}</div></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={refresh}>🔄 {t("common.refresh")}</button>
          <button className="btn btnPrimary" onClick={() => setShowForm(!showForm)}>{showForm ? t("common.cancel") : t("projects.newProject")}</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: t("projects.total"),     value: projects.length,                                          color: "var(--primary)" },
          { label: t("projects.active"),    value: projects.filter(p => p.status === "active").length,       color: "var(--success)" },
          { label: t("projects.onHold"),    value: projects.filter(p => p.status === "on_hold").length,      color: "var(--warning)" },
          { label: t("projects.completed"), value: projects.filter(p => p.status === "completed").length,    color: "var(--muted)" },
        ].map(k => <div key={k.label} className="kpi-card"><div className="kpi-label">{k.label}</div><div className="kpi-value" style={{ fontSize: 28, color: k.color }}>{k.value}</div></div>)}
      </div>

      {showForm && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>{t("projects.newProject")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("projects.projectName")} *</div><input className="input" placeholder={t("projects.namePlaceholder")} value={pName} onChange={e => setPName(e.target.value)} /></div>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("manufacturing.priority")}</div>
              <select className="input" value={pPriority} onChange={e => setPPriority(e.target.value)}>{["low","medium","high","critical"].map(p => <option key={p} value={p}>{t(`manufacturing.priorities.${p}`)}</option>)}</select>
            </div>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("projects.budget")}</div><input className="input" type="number" value={pBudget} onChange={e => setPBudget(e.target.value)} /></div>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("projects.startDate")}</div><input className="input" type="date" value={pStart} onChange={e => setPStart(e.target.value)} /></div>
            <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("projects.dueDate")}</div><input className="input" type="date" value={pDue} onChange={e => setPDue(e.target.value)} /></div>
            <div style={{ gridColumn: "1/-1" }}><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("common.description")}</div><input className="input" value={pDesc} onChange={e => setPDesc(e.target.value)} /></div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <button className="btn" onClick={() => setShowForm(false)}>{t("common.cancel")}</button>
            <button className="btn btnPrimary" onClick={handleCreateProject} disabled={saving}>{saving ? t("common.saving") : t("projects.createProject")}</button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 16, alignItems: "start" }}>
        <div className="card">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>{t("projects.allProjects")} ({projects.length})</div>
          {loading ? <div style={{ padding: 20, color: "var(--muted)" }}>{t("common.loading")}</div> : projects.length === 0 ? <div style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>{t("projects.noProjects")}</div> : projects.map(p => (
            <div key={p.id} onClick={() => loadTasks(p)} style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: selected?.id === p.id ? "var(--primary-light)" : "white" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 700 }}>{p.name}</div>
                <span className={`badge ${STATUS_COLORS[p.status]}`}>{t(`projects.statuses.${p.status}`)}</span>
              </div>
              {p.description && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{p.description}</div>}
              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                <span className={`badge ${PRIORITY_COLORS[p.priority]}`} style={{ fontSize: 10 }}>{t(`manufacturing.priorities.${p.priority}`)}</span>
                {p.budget > 0 && <span className="badge" style={{ fontSize: 10 }}>💰 {money(p.budget)}</span>}
                {p.due_date && <span className="badge" style={{ fontSize: 10 }}>📅 {p.due_date}</span>}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                {p.status === "active" && <button className="btn" style={{ fontSize: 11, padding: "2px 8px" }} onClick={e => { e.stopPropagation(); handleProjectStatus(p.id, "completed"); }}>✅</button>}
                {p.status === "active" && <button className="btn btnDanger" style={{ fontSize: 11, padding: "2px 8px" }} onClick={e => { e.stopPropagation(); handleProjectStatus(p.id, "on_hold"); }}>⏸</button>}
                <button className="btn btnDanger" style={{ fontSize: 11, padding: "2px 8px" }} onClick={e => { e.stopPropagation(); handleDeleteProject(p.id); }}>🗑</button>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          {!selected ? <div style={{ padding: 40, color: "var(--muted)", textAlign: "center" }}>👈 {t("projects.selectProject")}</div> : (
            <>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><div style={{ fontWeight: 700, fontSize: 15 }}>{selected.name}</div><div style={{ fontSize: 12, color: "var(--muted)" }}>{tasks.length} {t("projects.tasks")}</div></div>
                <button className="btn btnPrimary" style={{ fontSize: 12 }} onClick={() => setShowTask(!showTask)}>{showTask ? t("common.cancel") : t("projects.addTask")}</button>
              </div>
              {showTask && (
                <div style={{ padding: 16, borderBottom: "1px solid var(--border)", background: "#f8fafc" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
                    <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("projects.taskTitle")} *</div><input className="input" value={tTitle} onChange={e => setTTitle(e.target.value)} /></div>
                    <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("manufacturing.priority")}</div>
                      <select className="input" value={tPriority} onChange={e => setTPriority(e.target.value)}>{["low","medium","high","critical"].map(p => <option key={p} value={p}>{t(`manufacturing.priorities.${p}`)}</option>)}</select>
                    </div>
                    <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("projects.assignee")}</div><input className="input" value={tAssignee} onChange={e => setTAssignee(e.target.value)} /></div>
                    <div><div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("projects.dueDate")}</div><input className="input" type="date" value={tDue} onChange={e => setTDue(e.target.value)} /></div>
                    <button className="btn btnPrimary" onClick={handleCreateTask}>{t("common.add")}</button>
                  </div>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0 }}>
                {["todo","in_progress","review","done"].map((s, i) => (
                  <div key={s} style={{ borderRight: i < 3 ? "1px solid var(--border)" : "none", padding: 12, minHeight: 200 }}>
                    <div style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", color: "var(--muted)", marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                      <span>{t(`projects.taskStatuses.${s}`)}</span>
                      <span className={`badge ${TASK_COLORS[s]}`}>{tasksByStatus[s].length}</span>
                    </div>
                    {tasksByStatus[s].map(task => (
                      <div key={task.id} className="card" style={{ padding: 10, marginBottom: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{task.title}</div>
                        {task.assignee_name && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>👤 {task.assignee_name}</div>}
                        {task.due_date && <div style={{ fontSize: 11, color: "var(--muted)" }}>📅 {task.due_date}</div>}
                        <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                          <span className={`badge ${PRIORITY_COLORS[task.priority]}`} style={{ fontSize: 10 }}>{t(`manufacturing.priorities.${task.priority}`)}</span>
                        </div>
                        <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                          {task.status !== "done" && (
                            <select className="input" style={{ fontSize: 11, padding: "2px 6px" }} value={task.status} onChange={e => handleTaskStatus(task.id, e.target.value)}>
                              {["todo","in_progress","review","done"].map(st => <option key={st} value={st}>{t(`projects.taskStatuses.${st}`)}</option>)}
                            </select>
                          )}
                          <button className="btn btnDanger" style={{ fontSize: 11, padding: "2px 6px" }} onClick={() => handleDeleteTask(task.id)}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
