import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useState } from "react";

const FEATURES = [
  { icon: "📊", title: "Dashboard & Analytics",    desc: "KPIs en tiempo real, gráficas, notificaciones inteligentes" },
  { icon: "🧾", title: "Facturas & Cobros",         desc: "Crea, envía y rastrea facturas con exportación PDF" },
  { icon: "📦", title: "Gestión de Inventario",     desc: "Productos, niveles de stock, escáner de código de barras" },
  { icon: "📣", title: "CRM & Ventas",              desc: "Pipeline, clientes, órdenes, deals" },
  { icon: "👥", title: "RRHH & Nómina",             desc: "Empleados, corridas de nómina, recibos PDF" },
  { icon: "🏭", title: "Compras & Proveedores",     desc: "Proveedores, órdenes de compra, recepción" },
  { icon: "💬", title: "Mensajería de Equipo",      desc: "Chat en tiempo real con canales, estilo Slack" },
  { icon: "🔍", title: "Búsqueda Global",           desc: "Busca todo con Ctrl+K" },
  { icon: "📅", title: "Calendario & Eventos",      desc: "Sincronizado automáticamente con tu ERP" },
  { icon: "📄", title: "Exportación PDF",           desc: "Imprime cualquier documento al instante" },
  { icon: "👑", title: "Gestión de Roles",          desc: "Permisos de Admin, Manager, Empleado" },
  { icon: "🌍", title: "Multi-idioma",              desc: "Inglés y Español integrados" },
];

const STATS = [
  { value: "27",   label: "Módulos"     },
  { value: "100%", label: "TypeScript"  },
  { value: "∞",    label: "Escalable"   },
  { value: "Live", label: "Tiempo Real" },
];

const PRICING_TEASER = [
  { name: "Starter",    renta: "$599",  licencia: "$5,999",  color: "#3b82f6", users: "1–3 usuarios" },
  { name: "Business",   renta: "$1,299", licencia: "$12,999", color: "#6366f1", users: "hasta 15 usuarios", popular: true },
  { name: "Enterprise", renta: "$2,999", licencia: "$29,999", color: "#a855f7", users: "Ilimitados" },
];

const DEMO_EMAIL    = "demo@erpsystem.com";
const DEMO_PASSWORD = "demo1234";

export default function DemoGateway() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function enterDemo() {
    setLoading(true);
    setError("");
    try {
      let { error: signInErr } = await supabase.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
      if (signInErr) {
        const { error: signUpErr } = await supabase.auth.signUp({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
        if (signUpErr) throw new Error(signUpErr.message);
        const { error: signInErr2 } = await supabase.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
        if (signInErr2) throw new Error(signInErr2.message);
      }
      navigate("/app/dashboard");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%)", color:"white", fontFamily:"Inter,system-ui,sans-serif" }}>

      {/* Nav */}
      <nav style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 60px", borderBottom:"1px solid rgba(255,255,255,0.08)", flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#3b82f6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>⚡</div>
          <div>
            <div style={{ fontWeight:800, fontSize:18, letterSpacing:-0.5 }}>ERP System</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:-2 }}>Enterprise Edition</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <button onClick={()=>navigate("/pricing")}
            style={{ padding:"8px 20px", borderRadius:8, border:"1px solid rgba(255,255,255,0.2)", background:"transparent", color:"white", cursor:"pointer", fontSize:13, fontWeight:600 }}>
            💰 Precios
          </button>
          <button onClick={()=>navigate("/login")}
            style={{ padding:"8px 20px", borderRadius:8, border:"1px solid rgba(255,255,255,0.2)", background:"transparent", color:"white", cursor:"pointer", fontSize:13, fontWeight:600 }}>
            Iniciar Sesión
          </button>
          <button onClick={enterDemo} disabled={loading}
            style={{ padding:"8px 20px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#3b82f6,#6366f1)", color:"white", cursor:"pointer", fontSize:13, fontWeight:700, opacity:loading?0.7:1 }}>
            {loading ? "Cargando..." : "Demo Gratis"}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign:"center", padding:"80px 40px 60px" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.3)", borderRadius:100, padding:"6px 16px", fontSize:13, color:"#a5b4fc", marginBottom:24 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:"#a5b4fc", display:"inline-block" }}></span>
          Demo en Vivo — Sin registro requerido
        </div>
        <h1 style={{ fontSize:"clamp(36px,6vw,72px)", fontWeight:900, lineHeight:1.1, margin:"0 0 24px", letterSpacing:-2 }}>
          El ERP Completo para<br />
          <span style={{ background:"linear-gradient(135deg,#3b82f6,#a855f7,#ec4899)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            Tu Negocio
          </span>
        </h1>
        <p style={{ fontSize:18, color:"rgba(255,255,255,0.6)", maxWidth:560, margin:"0 auto 40px", lineHeight:1.7 }}>
          Administra ventas, inventario, finanzas, RRHH y operaciones — todo en un solo lugar.
          Diseñado para negocios modernos que crecen rápido.
        </p>
        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <button onClick={enterDemo} disabled={loading}
            style={{ padding:"16px 36px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#3b82f6,#6366f1)", color:"white", cursor:"pointer", fontSize:16, fontWeight:700, boxShadow:"0 4px 20px rgba(99,102,241,0.4)" }}>
            {loading ? "⏳ Entrando..." : "🚀 Entrar a la Demo"}
          </button>
          <button onClick={()=>navigate("/pricing")}
            style={{ padding:"16px 36px", borderRadius:12, border:"1px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.05)", color:"white", cursor:"pointer", fontSize:16, fontWeight:700 }}>
            💰 Ver Precios
          </button>
        </div>
        {error && <div style={{ marginTop:16, color:"#fca5a5", fontSize:13 }}>⚠️ {error}</div>}
        <div style={{ marginTop:12, fontSize:12, color:"rgba(255,255,255,0.35)" }}>
          demo@erpsystem.com / demo1234 — acceso completo a todos los módulos
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"flex", justifyContent:"center", maxWidth:600, margin:"0 auto 80px", borderRadius:16, overflow:"hidden", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)" }}>
        {STATS.map((s,i) => (
          <div key={i} style={{ flex:1, textAlign:"center", padding:"24px 16px", borderRight:i<STATS.length-1?"1px solid rgba(255,255,255,0.08)":"none" }}>
            <div style={{ fontSize:28, fontWeight:900, color:"#60a5fa" }}>{s.value}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 40px 80px" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <h2 style={{ fontSize:36, fontWeight:800, margin:"0 0 12px", letterSpacing:-1 }}>Todo lo que tu negocio necesita</h2>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:16 }}>27 módulos, completamente integrados y listos para usar</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16 }}>
          {FEATURES.map((f,i) => (
            <div key={i}
              style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:24, transition:"all 0.2s" }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="rgba(99,102,241,0.12)";(e.currentTarget as HTMLElement).style.borderColor="rgba(99,102,241,0.4)";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.04)";(e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.08)";}}>
              <div style={{ fontSize:32, marginBottom:12 }}>{f.icon}</div>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:6 }}>{f.title}</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Teaser */}
      <div style={{ maxWidth:1000, margin:"0 auto 80px", padding:"0 40px" }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <h2 style={{ fontSize:36, fontWeight:800, margin:"0 0 12px", letterSpacing:-1 }}>Planes y Precios</h2>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:16 }}>Sin contratos. Renta mensual o licencia única.</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:20, marginBottom:32 }}>
          {PRICING_TEASER.map((p,i) => (
            <div key={i} style={{ background:(p as any).popular?"rgba(99,102,241,0.15)":"rgba(255,255,255,0.04)", border:`2px solid ${(p as any).popular?"#6366f1":"rgba(255,255,255,0.1)"}`, borderRadius:16, padding:28, position:"relative" }}>
              {(p as any).popular && <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:"linear-gradient(135deg,#6366f1,#a855f7)", color:"white", padding:"3px 14px", borderRadius:100, fontSize:11, fontWeight:800 }}>MÁS POPULAR</div>}
              <div style={{ fontWeight:800, fontSize:18, marginBottom:6 }}>{p.name}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:16 }}>{p.users}</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)", marginBottom:4 }}>🔄 Renta: <strong style={{ color:"white" }}>{p.renta} MXN/mes</strong></div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)" }}>💰 Licencia: <strong style={{ color:"white" }}>{p.licencia} MXN</strong></div>
            </div>
          ))}
        </div>
        <div style={{ textAlign:"center" }}>
          <button onClick={()=>navigate("/pricing")}
            style={{ padding:"14px 40px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#3b82f6,#6366f1)", color:"white", cursor:"pointer", fontSize:15, fontWeight:700, boxShadow:"0 4px 20px rgba(99,102,241,0.3)" }}>
            Ver todos los planes y contratar →
          </button>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", margin:"0 40px 80px", borderRadius:24, padding:"60px 40px", textAlign:"center", maxWidth:900, marginLeft:"auto", marginRight:"auto" }}>
        <h2 style={{ fontSize:36, fontWeight:800, margin:"0 0 16px", letterSpacing:-1 }}>¿Listo para verlo en acción?</h2>
        <p style={{ color:"rgba(255,255,255,0.6)", marginBottom:32, fontSize:16 }}>Sin tarjeta de crédito. Sin registro. Solo haz clic y explora.</p>
        <button onClick={enterDemo} disabled={loading}
          style={{ padding:"18px 48px", borderRadius:14, border:"none", background:"linear-gradient(135deg,#3b82f6,#6366f1)", color:"white", cursor:"pointer", fontSize:18, fontWeight:800, boxShadow:"0 4px 24px rgba(99,102,241,0.4)" }}>
          {loading ? "Cargando..." : "🚀 Iniciar Demo Ahora"}
        </button>
        <div style={{ marginTop:16, fontSize:13, color:"rgba(255,255,255,0.35)" }}>
          demo@erpsystem.com &nbsp;|&nbsp; Contraseña: demo1234
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop:"1px solid rgba(255,255,255,0.08)", padding:"24px 60px", display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:13, color:"rgba(255,255,255,0.35)", flexWrap:"wrap", gap:12 }}>
        <div>⚡ ERP System — Enterprise Edition</div>
        <div style={{ display:"flex", gap:24 }}>
          <span style={{ cursor:"pointer" }} onClick={()=>navigate("/pricing")}>💰 Precios</span>
          <span style={{ cursor:"pointer" }} onClick={()=>navigate("/login")}>Iniciar Sesión</span>
          <span style={{ cursor:"pointer" }} onClick={enterDemo}>Demo</span>
        </div>
      </footer>
    </div>
  );
}