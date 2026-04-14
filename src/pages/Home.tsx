import { useNavigate } from "react-router-dom";

const FEATURES = [
  { icon: "📊", title: "Dashboard & Analytics",     desc: "KPIs en tiempo real, graficas y notificaciones inteligentes" },
  { icon: "🧾", title: "Facturas & Cobros",          desc: "Crea, envia y rastrea facturas con exportacion a PDF" },
  { icon: "📦", title: "Gestion de Inventario",      desc: "Productos, niveles de stock, movimientos y alertas" },
  { icon: "📣", title: "CRM & Ventas",               desc: "Pipeline, clientes, ordenes y seguimiento de deals" },
  { icon: "👤", title: "RRHH & Nomina",              desc: "Empleados, corridas de nomina y recibos en PDF" },
  { icon: "🏗️", title: "Manufactura & Proyectos",   desc: "Ordenes de trabajo, proyectos y logistica integrada" },
  { icon: "📒", title: "Contabilidad",               desc: "Libro mayor, reportes financieros, cuentas por pagar/cobrar" },
  { icon: "🛒", title: "Compras & Proveedores",      desc: "Ordenes de compra, recepcion y gestion de proveedores" },
  { icon: "⚙️", title: "Configuracion & Roles",     desc: "Usuarios, permisos, monedas, idioma y plantillas" },
];

const STATS = [
  { value: "27",    label: "Modulos"     },
  { value: "100%",  label: "TypeScript"  },
  { value: "∞",     label: "Escalable"   },
  { value: "Live",  label: "Tiempo Real" },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%)", color: "white", fontFamily: "Inter,system-ui,sans-serif" }}>

      {/* Navbar */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 40px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#3b82f6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
            ⚡
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>ERP System</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: -2 }}>Enterprise Edition</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => navigate("/pricing")}
            style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            💰 Precios
          </button>
          <button onClick={() => navigate("/login")}
            style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            Iniciar Sesion
          </button>
          <button onClick={() => navigate("/app/dashboard")}
            style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
            Demo Gratis
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "80px 40px 60px" }}>
        <div style={{ display: "inline-block", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", borderRadius: 20, padding: "6px 20px", fontSize: 13, marginBottom: 32, color: "rgba(255,255,255,0.8)" }}>
          ● Demo en Vivo — Sin registro requerido
        </div>
        <h1 style={{ fontSize: 64, fontWeight: 900, margin: "0 0 8px", lineHeight: 1.05, letterSpacing: -2 }}>
          El ERP Completo para
        </h1>
        <h1 style={{ fontSize: 64, fontWeight: 900, margin: "0 0 28px", lineHeight: 1.05, letterSpacing: -2, background: "linear-gradient(135deg,#6366f1,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Tu Negocio
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 18, maxWidth: 600, margin: "0 auto 40px", lineHeight: 1.6 }}>
          Administra ventas, inventario, finanzas, RRHH y operaciones — todo en un solo lugar. Diseñado para negocios modernos que crecen rapido.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 16 }}>
          <button onClick={() => navigate("/app/dashboard")}
            style={{ padding: "16px 36px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#6366f1,#3b82f6)", color: "white", cursor: "pointer", fontSize: 17, fontWeight: 800 }}>
            🚀 Entrar a la Demo
          </button>
          <button onClick={() => navigate("/pricing")}
            style={{ padding: "16px 36px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.07)", color: "white", cursor: "pointer", fontSize: 17, fontWeight: 700 }}>
            💰 Ver Precios
          </button>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 56 }}>
          demo@erpsystem.com / demo1234 — acceso completo a todos los modulos
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, maxWidth: 700, margin: "0 auto" }}>
          {STATS.map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "20px 16px" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#6366f1", marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 40px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, margin: "0 0 12px" }}>Todo lo que tu negocio necesita</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>27 modulos, completamente integrados y listos para usar</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "24px" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", margin: "0 40px 80px", borderRadius: 24, padding: "60px 40px", textAlign: "center", maxWidth: 900, marginLeft: "auto", marginRight: "auto" }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, margin: "0 0 16px", letterSpacing: -1 }}>¿Listo para verlo en accion?</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 32, fontSize: 16 }}>Sin tarjeta. Sin registro. Solo haz clic y explora.</p>
        <button onClick={() => navigate("/app/dashboard")}
          style={{ background: "linear-gradient(135deg,#6366f1,#3b82f6)", color: "white", border: "none", borderRadius: 12, padding: "16px 40px", fontSize: 18, fontWeight: 800, cursor: "pointer" }}>
          🚀 Entrar a la Demo Gratis
        </button>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "20px 40px", display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
        <div>⚡ ERP System — Enterprise Edition</div>
        <div style={{ display: "flex", gap: 24 }}>
          <span style={{ cursor: "pointer" }} onClick={() => navigate("/login")}>Iniciar Sesion</span>
          <span style={{ cursor: "pointer" }} onClick={() => navigate("/pricing")}>Precios</span>
          <span style={{ cursor: "pointer" }} onClick={() => navigate("/app/dashboard")}>Demo</span>
        </div>
      </div>

    </div>
  );
}
