import { useState } from "react";

const WHATSAPP_URL = "https://wa.me/521XXXXXXXXXX";
const CONTACT_EMAIL = "peval.com.mx@gmail.com";

const MONTHLY  = { starter: 599,  business: 1299,  enterprise: 2999  };
const LIFETIME = { starter: 8990, business: 18990, enterprise: 39990 };

const STARTER_INCLUDED  = ["Hasta 3 usuarios","Dashboard & Analytics","Clientes & Ventas","Inventario hasta 500 productos","Facturas & Cobros","Proveedores & Ordenes de Compra","Soporte por email"];
const STARTER_EXCLUDED  = ["CRM & Pipeline de ventas","Nomina & RRHH","Manufactura & Proyectos","Reportes financieros avanzados","Usuarios ilimitados"];
const BUSINESS_INCLUDED = ["Hasta 15 usuarios","Todo lo del plan Starter","CRM & Pipeline de ventas","Nomina & Gestion de RRHH","Proyectos & Tareas","Manufactura & Ordenes de trabajo","Reportes financieros avanzados","Ledger contable & Balance general","Logistica & Envios","Mensajeria interna del equipo","Soporte prioritario 24h"];
const BUSINESS_EXCLUDED = ["API access completo","White-label / marca propia","Usuarios ilimitados"];
const ENTERPRISE_INCLUDED = ["Usuarios ILIMITADOS","Todo lo del plan Business","API access completo","White-label / tu propia marca","Onboarding personalizado","Gerente de cuenta dedicado","SLA 99.9% uptime garantizado","Capacitacion del equipo incluida","Soporte 24/7 WhatsApp"];

const INDUSTRIES = [
  { icon: "🍽️", label: "Restaurantes" },
  { icon: "🛍️", label: "Tiendas" },
  { icon: "🏭", label: "Manufactura" },
  { icon: "🏥", label: "Clinicas" },
  { icon: "📣", label: "Agencias" },
  { icon: "🚚", label: "Distribuidoras" },
  { icon: "🏗️", label: "Construccion" },
  { icon: "🔧", label: "Servicios" },
];

const ALL_INCLUDE = [
  "Actualizaciones automaticas",
  "Copias de seguridad diarias",
  "SSL y datos cifrados",
  "Acceso desde cualquier dispositivo",
  "Soporte en espanol",
  "Demo siempre disponible",
];

const FAQS = [
  { q: "¿Puedo cambiar de plan despues?", a: "Si, puedes cambiar de plan en cualquier momento. El cambio se aplica en tu siguiente ciclo de facturacion." },
  { q: "¿Que metodos de pago acepta Mercado Pago?", a: "Tarjeta de credito/debito, SPEI (transferencia bancaria), OXXO Pay y otros metodos locales." },
  { q: "¿La licencia unica incluye actualizaciones?", a: "Incluye actualizaciones por 12 meses. Despues puedes renovar el soporte o seguir usando la version actual." },
  { q: "¿Puedo probar antes de comprar?", a: "Si, tenemos una demo completamente funcional disponible sin necesidad de tarjeta de credito." },
  { q: "¿Es seguro pagar con Mercado Pago?", a: "Si, Mercado Pago es el procesador de pagos lider en Latinoamerica con cifrado SSL y proteccion al comprador." },
];

function FeatureRow({ text, included, color = "#22c55e" }: { text: string; included: boolean; color?: string }) {
  return (
    <div style={{ display: "flex", gap: 10, fontSize: 14, alignItems: "center", opacity: included ? 1 : 0.4 }}>
      <span style={{ color: included ? color : "#ef4444", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
        {included ? "✔" : "✕"}
      </span>
      {text}
    </div>
  );
}

export default function Pricing() {
  const [tab, setTab]         = useState<"monthly" | "lifetime">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const prices = tab === "monthly" ? MONTHLY : LIFETIME;
  const suffix  = tab === "monthly" ? "/ mes" : "licencia unica";

  const cardBase: React.CSSProperties = {
    borderRadius: 16,
    padding: 28,
    display: "flex",
    flexDirection: "column",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "white",
  };

  return (
    <div style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)", minHeight: "100vh", color: "white", fontFamily: "inherit" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 40px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 28 }}>⚡</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>ERP System</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Enterprise Edition</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>🌐 EN</button>
          <button style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>🚀 Demo Gratis</button>
          <button style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Iniciar Sesion</button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", padding: "60px 0 40px" }}>
          <div style={{ display: "inline-block", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 20, padding: "6px 20px", fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
            • Pago seguro via Mercado Pago · Tarjeta, SPEI, OXXO · Sin contratos
          </div>
          <h1 style={{ fontSize: 52, fontWeight: 900, margin: "0 0 8px", lineHeight: 1.1 }}>Planes y Precios</h1>
          <h2 style={{ fontSize: 48, fontWeight: 900, margin: "0 0 20px", background: "linear-gradient(135deg,#6366f1,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Para cada negocio
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, marginBottom: 32 }}>
            Elige entre renta mensual o licencia unica. Pago seguro procesado<br />por Mercado Pago.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", marginBottom: 40, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
            <span>🔒 SSL Cifrado</span>
            <span>💳 Tarjeta / SPEI / OXXO</span>
            <span>🛡️ Proteccion al Comprador</span>
            <span>🏆 Mercado Pago Oficial</span>
          </div>
          {/* Toggle */}
          <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: 4, gap: 4 }}>
            <button onClick={() => setTab("monthly")} style={{ padding: "10px 28px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, background: tab === "monthly" ? "white" : "transparent", color: tab === "monthly" ? "#1e1b4b" : "rgba(255,255,255,0.7)" }}>
              📅 Renta Mensual
            </button>
            <button onClick={() => setTab("lifetime")} style={{ padding: "10px 28px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, background: tab === "lifetime" ? "white" : "transparent", color: tab === "lifetime" ? "#1e1b4b" : "rgba(255,255,255,0.7)" }}>
              🔑 Licencia Unica
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 60 }}>

          {/* Starter */}
          <div style={cardBase}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Starter</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 20 }}>1 – 3 usuarios</div>
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 40, fontWeight: 900 }}>${prices.starter.toLocaleString()}</span>
              <span style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginLeft: 6 }}>MXN {suffix}</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>+ IVA</div>
            <div style={{ display: "grid", gap: 10, marginBottom: 24, flex: 1 }}>
              {STARTER_INCLUDED.map(f => <FeatureRow key={f} text={f} included={true} />)}
              {STARTER_EXCLUDED.map(f => <FeatureRow key={f} text={f} included={false} />)}
            </div>
            <button style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white", border: "none", borderRadius: 10, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer", width: "100%", marginBottom: 8 }}>
              🛒 Comprar Ahora
            </button>
            <div style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>🔒 Pago seguro · Tarjeta, SPEI, OXXO</div>
          </div>

          {/* Business */}
          <div style={{ ...cardBase, border: "2px solid #6366f1", background: "rgba(99,102,241,0.15)", position: "relative" }}>
            <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#f59e0b,#fbbf24)", color: "#1e1b4b", padding: "5px 18px", borderRadius: 20, fontSize: 12, fontWeight: 800, whiteSpace: "nowrap" }}>
              ⭐ MAS POPULAR
            </div>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Business</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 20 }}>hasta 15 usuarios</div>
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 40, fontWeight: 900 }}>${prices.business.toLocaleString()}</span>
              <span style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginLeft: 6 }}>MXN {suffix}</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>+ IVA</div>
            <div style={{ display: "grid", gap: 10, marginBottom: 24, flex: 1 }}>
              {BUSINESS_INCLUDED.map(f => <FeatureRow key={f} text={f} included={true} color="#818cf8" />)}
              {BUSINESS_EXCLUDED.map(f => <FeatureRow key={f} text={f} included={false} />)}
            </div>
            <button style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white", border: "none", borderRadius: 10, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer", width: "100%", marginBottom: 8 }}>
              🛒 Comprar Ahora
            </button>
            <div style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>🔒 Pago seguro · Tarjeta, SPEI, OXXO</div>
          </div>

          {/* Enterprise */}
          <div style={{ ...cardBase, border: "1px solid rgba(139,92,246,0.4)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Enterprise</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 20 }}>Usuarios ILIMITADOS</div>
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 40, fontWeight: 900 }}>${prices.enterprise.toLocaleString()}</span>
              <span style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginLeft: 6 }}>MXN {suffix}</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>+ IVA</div>
            <div style={{ display: "grid", gap: 10, marginBottom: 24, flex: 1 }}>
              {ENTERPRISE_INCLUDED.map(f => <FeatureRow key={f} text={f} included={true} color="#a78bfa" />)}
            </div>
            <button style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "white", border: "none", borderRadius: 10, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer", width: "100%", marginBottom: 8 }}>
              📞 Contactar Ventas
            </button>
            <div style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>🔒 Pago seguro · Tarjeta, SPEI, OXXO</div>
          </div>
        </div>

        {/* Industries */}
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>IDEAL PARA</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {INDUSTRIES.map(i => (
              <span key={i.label} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "8px 18px", fontSize: 14 }}>
                {i.icon} {i.label}
              </span>
            ))}
          </div>
        </div>

        {/* All plans include */}
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "32px 40px", marginBottom: 60, textAlign: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 20 }}>📋 Todos los planes incluyen</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {ALL_INCLUDE.map(f => (
              <div key={f} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14, color: "rgba(255,255,255,0.85)" }}>
                <span style={{ color: "#22c55e", fontWeight: 700, flexShrink: 0 }}>✔</span>{f}
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: 60 }}>
          <h2 style={{ textAlign: "center", fontWeight: 800, fontSize: 32, marginBottom: 32 }}>Preguntas frecuentes</h2>
          <div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, overflow: "hidden" }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "none", color: "white", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontSize: 15, fontWeight: 600, textAlign: "left" }}>
                  {faq.q}
                  <span style={{ fontSize: 20, flexShrink: 0, marginLeft: 16 }}>{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && <div style={{ padding: "0 24px 20px", fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "48px 32px", textAlign: "center", marginBottom: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>💬</div>
          <h3 style={{ fontWeight: 800, fontSize: 24, marginBottom: 8 }}>¿Necesitas solucion personalizada?</h3>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>Hablamos contigo para encontrar el plan perfecto para tu negocio.</p>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>✉️ {CONTACT_EMAIL}</div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" style={{ background: "#25d366", color: "white", textDecoration: "none", borderRadius: 10, padding: "12px 28px", fontWeight: 700, fontSize: 15 }}>📱 WhatsApp</a>
            <button style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white", border: "none", borderRadius: 10, padding: "12px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>🚀 Ver Demo</button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", padding: "20px 0", display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
          <span>ERP System · Enterprise Edition</span>
          <div style={{ display: "flex", gap: 20 }}>
            <span style={{ cursor: "pointer" }}>Demo</span>
            <span style={{ cursor: "pointer" }}>Iniciar Sesion</span>
            <span>✉️ {CONTACT_EMAIL}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
