import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const MP_ACCESS_TOKEN = "APP_USR-8453572761926031-041214-9d142d666feb02c5f56a2e8641fd71f1-3258944496";
const WHATSAPP_URL    = "https://wa.me/527778003049";
const CONTACT_EMAIL   = "peval.com.mx@gmail.com";

const MONTHLY  = { starter: 1299, business: 2499, enterprise: 4999 };
const LIFETIME = { starter: 8990, business: 18990, enterprise: 39990 };

const STARTER_INCLUDED   = ["Hasta 3 usuarios","Dashboard & Analytics","Clientes & Ventas","Inventario hasta 500 productos","Facturas & Cobros","Proveedores & Ordenes de Compra","Soporte por email"];
const STARTER_EXCLUDED   = ["CRM & Pipeline de ventas","Nomina & RRHH","Manufactura & Proyectos","Reportes financieros avanzados","Usuarios ilimitados"];
const BUSINESS_INCLUDED  = ["Hasta 15 usuarios","Todo lo del plan Starter","CRM & Pipeline de ventas","Nomina & Gestion de RRHH","Proyectos & Tareas","Manufactura & Ordenes de trabajo","Reportes financieros avanzados","Logistica & Operaciones","Soporte prioritario"];
const BUSINESS_EXCLUDED  = ["API access completo","White-label / marca propia","Usuarios ilimitados"];
const ENTERPRISE_INCLUDED = ["Usuarios ILIMITADOS","Todo lo del plan Business","API access completo","White-label / tu propia marca","Onboarding personalizado","Gerente de cuenta dedicado","SLA 99.9%","Soporte 24/7"];

const INDUSTRIES = [
  { label: "Restaurantes",   slug: "restaurantes"   },
  { label: "Tiendas",        slug: "tiendas"        },
  { label: "Manufactura",    slug: "manufactura"    },
  { label: "Clinicas",       slug: "clinicas"       },
  { label: "Agencias",       slug: "agencias"       },
  { label: "Distribuidoras", slug: "distribuidoras" },
  { label: "Construccion",   slug: "construccion"   },
  { label: "Servicios",      slug: "servicios"      },
];

const ALL_INCLUDE = ["Actualizaciones automaticas","Copias de seguridad diarias","SSL y datos cifrados","Acceso desde cualquier dispositivo","Soporte en espanol","Demo siempre disponible"];

const FAQS = [
  { q: "Puedo cambiar de plan despues?", a: "Si, puedes cambiar de plan en cualquier momento." },
  { q: "Que metodos de pago acepta Mercado Pago?", a: "Tarjeta de credito/debito, SPEI, OXXO Pay." },
  { q: "La licencia unica incluye actualizaciones?", a: "Incluye actualizaciones por 12 meses." },
  { q: "Puedo probar antes de comprar?", a: "Si, tenemos una demo completamente funcional sin tarjeta." },
  { q: "Es seguro pagar con Mercado Pago?", a: "Si, Mercado Pago es el procesador lider en Latinoamerica." },
];

function FeatureRow({ text, included, color = "#22c55e" }: { text: string; included: boolean; color?: string }) {
  return (
    <div style={{ display:"flex", gap:10, fontSize:14, alignItems:"center", opacity: included ? 1 : 0.4 }}>
      <span style={{ color: included ? color : "#ef4444", fontWeight:700, fontSize:15, flexShrink:0 }}>
        {included ? "+" : "x"}
      </span>
      {text}
    </div>
  );
}

async function createPreference(title: string, price: number) {
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const backUrl = isLocal ? "https://sistemaerp.peval.com.mx" : window.location.origin;
  const body: any = {
    items: [{ title, quantity: 1, unit_price: price, currency_id: "MXN" }],
    back_urls: { success: backUrl + "/login", failure: backUrl + "/pricing", pending: backUrl + "/pricing" },
  };
  if (!isLocal) body.auto_return = "approved";
  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + MP_ACCESS_TOKEN },
    body: JSON.stringify(body),
  });
  return res.json();
}

export default function Pricing() {
  const [tab, setTab]         = useState<"monthly"|"lifetime">("monthly");
  const [openFaq, setOpenFaq] = useState<number|null>(null);
  const [loading, setLoading] = useState<string|null>(null);
  const navigate               = useNavigate();
  const { i18n }               = useTranslation();
  const prices = tab === "monthly" ? MONTHLY : LIFETIME;
  const suffix  = tab === "monthly" ? "/ mes" : "licencia unica";
  const isEs    = i18n.language === "es";

  function toggleLanguage() {
    const next = isEs ? "en" : "es";
    i18n.changeLanguage(next);
    localStorage.setItem("erp_language", next);
  }

  async function handleBuy(planName: string, price: number) {
    setLoading(planName);
    try {
      const data = await createPreference("ERP System Plan " + planName, price);
      if (data?.init_point) window.location.href = data.init_point;
      else if (data?.sandbox_init_point) window.location.href = data.sandbox_init_point;
      else { console.error("MP response:", data); alert("Error al iniciar pago."); }
    } catch(e) { console.error(e); alert("Error de conexion."); }
    finally { setLoading(null); }
  }

  const cardBase: React.CSSProperties = {
    borderRadius:16, padding:28, display:"flex", flexDirection:"column",
    background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"white",
  };
  const btnTab = (active: boolean): React.CSSProperties => ({
    padding:"10px 28px", borderRadius:10, border:"none", cursor:"pointer", fontWeight:700, fontSize:14,
    background: active ? "white" : "transparent", color: active ? "#1e1b4b" : "white",
  });
  const buyBtn: React.CSSProperties = {
    background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"white", border:"none",
    borderRadius:10, padding:"14px", fontWeight:700, fontSize:15, cursor:"pointer", width:"100%", marginBottom:8,
  };

  return (
    <div style={{ background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)", minHeight:"100vh", color:"white", fontFamily:"inherit" }}>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 40px", borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={() => navigate("/")}>  
          <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#3b82f6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:"white", fontSize:16 }}>E</div>
          <div>
            <div style={{ fontWeight:800, fontSize:16 }}>ERP System</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)" }}>Enterprise Edition</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={toggleLanguage} style={{ background:"rgba(255,255,255,0.1)", color:"white", border:"1px solid rgba(255,255,255,0.2)", borderRadius:8, padding:"8px 16px", cursor:"pointer", fontWeight:600, fontSize:13 }}>
            {isEs ? "EN" : "ES"}
          </button>
          <button onClick={() => navigate("/app/dashboard")} style={{ background:"rgba(255,255,255,0.1)", color:"white", border:"1px solid rgba(255,255,255,0.2)", borderRadius:8, padding:"8px 16px", cursor:"pointer", fontWeight:600, fontSize:13 }}>
            {isEs ? "Demo Gratis" : "Free Demo"}
          </button>
          <button onClick={() => navigate("/login")} style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"white", border:"none", borderRadius:8, padding:"8px 20px", cursor:"pointer", fontWeight:700, fontSize:13 }}>
            {isEs ? "Iniciar Sesion" : "Sign In"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 24px" }}>
        <div style={{ textAlign:"center", padding:"60px 0 40px" }}>
          <div style={{ display:"inline-block", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:20, padding:"6px 20px", fontSize:13, fontWeight:600, marginBottom:24 }}>
            Pago seguro via Mercado Pago - Tarjeta, SPEI, OXXO - Sin contratos
          </div>
          <h1 style={{ fontSize:52, fontWeight:900, margin:"0 0 8px" }}>{isEs ? "Planes y Precios" : "Plans & Pricing"}</h1>
          <h2 style={{ fontSize:48, fontWeight:900, margin:"0 0 20px", background:"linear-gradient(135deg,#6366f1,#ec4899)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            {isEs ? "Para cada negocio" : "For every business"}
          </h2>
          <p style={{ color:"rgba(255,255,255,0.7)", fontSize:16, marginBottom:32 }}>
            {isEs ? "Elige entre renta mensual o licencia unica. Pago seguro procesado por Mercado Pago." : "Choose monthly or lifetime. Secure payment via Mercado Pago."}
          </p>
          <div style={{ display:"flex", justifyContent:"center", gap:24, marginBottom:40, fontSize:13, color:"rgba(255,255,255,0.6)" }}>
            <span>SSL Cifrado</span><span>Tarjeta / SPEI / OXXO</span><span>Proteccion al Comprador</span><span>Mercado Pago Oficial</span>
          </div>
          <div style={{ display:"inline-flex", background:"rgba(255,255,255,0.08)", borderRadius:12, padding:4, gap:4 }}>
            <button onClick={() => setTab("monthly")}  style={btnTab(tab === "monthly")}>{isEs ? "Renta Mensual" : "Monthly"}</button>
            <button onClick={() => setTab("lifetime")} style={btnTab(tab === "lifetime")}>{isEs ? "Licencia Unica" : "Lifetime"}</button>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20, marginBottom:60 }}>

          <div style={cardBase}>
            <div style={{ fontWeight:900, fontSize:32, marginBottom:12, color:"#6366f1" }}>S</div>
            <div style={{ fontWeight:800, fontSize:22, marginBottom:4 }}>Starter</div>
            <div style={{ color:"rgba(255,255,255,0.6)", fontSize:13, marginBottom:20 }}>1 - 3 {isEs ? "usuarios" : "users"}</div>
            <div style={{ marginBottom:4 }}>
              <span style={{ fontSize:40, fontWeight:900 }}>{"$" + prices.starter.toLocaleString()}</span>
              <span style={{ fontSize:15, color:"rgba(255,255,255,0.7)", marginLeft:6 }}>MXN {suffix}</span>
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:24 }}>+ IVA</div>
            <div style={{ display:"grid", gap:10, marginBottom:24, flex:1 }}>
              {STARTER_INCLUDED.map(f => <FeatureRow key={f} text={f} included={true} />)}
              {STARTER_EXCLUDED.map(f  => <FeatureRow key={f} text={f} included={false} />)}
            </div>
            <button onClick={() => handleBuy("Starter", prices.starter)} disabled={loading === "Starter"} style={{ ...buyBtn, opacity: loading === "Starter" ? 0.7 : 1 }}>
              {loading === "Starter" ? "Procesando..." : (isEs ? "Comprar Ahora" : "Buy Now")}
            </button>
            <div style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.4)" }}>Pago seguro - Tarjeta, SPEI, OXXO</div>
          </div>

          <div style={{ ...cardBase, border:"2px solid #6366f1", background:"rgba(99,102,241,0.15)", position:"relative" }}>
            <div style={{ position:"absolute", top:-14, left:"50%", transform:"translateX(-50%)", background:"linear-gradient(135deg,#f59e0b,#fbbf24)", color:"#1e1b4b", padding:"5px 18px", borderRadius:20, fontSize:12, fontWeight:800, whiteSpace:"nowrap" }}>
              {isEs ? "MAS POPULAR" : "MOST POPULAR"}
            </div>
            <div style={{ fontWeight:900, fontSize:32, marginBottom:12, color:"#818cf8" }}>B</div>
            <div style={{ fontWeight:800, fontSize:22, marginBottom:4 }}>Business</div>
            <div style={{ color:"rgba(255,255,255,0.6)", fontSize:13, marginBottom:20 }}>{isEs ? "hasta 15 usuarios" : "up to 15 users"}</div>
            <div style={{ marginBottom:4 }}>
              <span style={{ fontSize:40, fontWeight:900 }}>{"$" + prices.business.toLocaleString()}</span>
              <span style={{ fontSize:15, color:"rgba(255,255,255,0.7)", marginLeft:6 }}>MXN {suffix}</span>
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:24 }}>+ IVA</div>
            <div style={{ display:"grid", gap:10, marginBottom:24, flex:1 }}>
              {BUSINESS_INCLUDED.map(f => <FeatureRow key={f} text={f} included={true} color="#818cf8" />)}
              {BUSINESS_EXCLUDED.map(f  => <FeatureRow key={f} text={f} included={false} />)}
            </div>
            <button onClick={() => handleBuy("Business", prices.business)} disabled={loading === "Business"} style={{ ...buyBtn, opacity: loading === "Business" ? 0.7 : 1 }}>
              {loading === "Business" ? "Procesando..." : (isEs ? "Comprar Ahora" : "Buy Now")}
            </button>
            <div style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.4)" }}>Pago seguro - Tarjeta, SPEI, OXXO</div>
          </div>

          <div style={{ ...cardBase, border:"1px solid rgba(139,92,246,0.4)" }}>
            <div style={{ fontWeight:900, fontSize:32, marginBottom:12, color:"#a78bfa" }}>E</div>
            <div style={{ fontWeight:800, fontSize:22, marginBottom:4 }}>Enterprise</div>
            <div style={{ color:"rgba(255,255,255,0.6)", fontSize:13, marginBottom:20 }}>{isEs ? "Usuarios ILIMITADOS" : "UNLIMITED Users"}</div>
            <div style={{ marginBottom:4 }}>
              <span style={{ fontSize:40, fontWeight:900 }}>{"$" + prices.enterprise.toLocaleString()}</span>
              <span style={{ fontSize:15, color:"rgba(255,255,255,0.7)", marginLeft:6 }}>MXN {suffix}</span>
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:24 }}>+ IVA</div>
            <div style={{ display:"grid", gap:10, marginBottom:24, flex:1 }}>
              {ENTERPRISE_INCLUDED.map(f => <FeatureRow key={f} text={f} included={true} color="#a78bfa" />)}
            </div>
            <button onClick={() => window.open(WHATSAPP_URL, "_blank")} style={{ ...buyBtn, background:"linear-gradient(135deg,#7c3aed,#a855f7)" }}>
              {isEs ? "Contactar Ventas" : "Contact Sales"}
            </button>
            <div style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.4)" }}>Pago seguro - Tarjeta, SPEI, OXXO</div>
          </div>
        </div>

        <div style={{ textAlign:"center", marginBottom:60 }}>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", letterSpacing:2, textTransform:"uppercase", marginBottom:16 }}>{isEs ? "IDEAL PARA" : "IDEAL FOR"}</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10, justifyContent:"center" }}>
            {INDUSTRIES.map(ind => (
              <span
                key={ind.slug}
                onClick={() => navigate("/industria/" + ind.slug)}
                style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:20, padding:"8px 18px", fontSize:14, cursor:"pointer" }}
              >
                {ind.label}
              </span>
            ))}
          </div>
        </div>

        <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:"32px 40px", marginBottom:60, textAlign:"center" }}>
          <div style={{ fontWeight:800, fontSize:20, marginBottom:20 }}>{isEs ? "Todos los planes incluyen" : "All plans include"}</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
            {ALL_INCLUDE.map(f => (
              <div key={f} style={{ display:"flex", gap:8, alignItems:"center", fontSize:14, color:"rgba(255,255,255,0.85)" }}>
                <span style={{ color:"#22c55e", fontWeight:700 }}>+</span>{f}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:60 }}>
          <h2 style={{ textAlign:"center", fontWeight:800, fontSize:32, marginBottom:32 }}>{isEs ? "Preguntas frecuentes" : "FAQ"}</h2>
          <div style={{ border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, overflow:"hidden" }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ borderBottom: i < FAQS.length-1 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width:"100%", background:"rgba(255,255,255,0.03)", border:"none", color:"white", padding:"20px 24px", display:"flex", justifyContent:"space-between", cursor:"pointer", fontSize:15, fontWeight:600, textAlign:"left" }}>
                  {faq.q}<span style={{ fontSize:20, marginLeft:16 }}>{openFaq === i ? "-" : "+"}</span>
                </button>
                {openFaq === i && <div style={{ padding:"0 24px 20px", fontSize:14, color:"rgba(255,255,255,0.7)", lineHeight:1.6 }}>{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:"48px 32px", textAlign:"center", marginBottom:60 }}>
          <h3 style={{ fontWeight:800, fontSize:24, marginBottom:8 }}>{isEs ? "Necesitas solucion personalizada?" : "Need a custom solution?"}</h3>
          <p style={{ color:"rgba(255,255,255,0.6)", marginBottom:24 }}>{isEs ? "Hablamos contigo para encontrar el plan perfecto." : "We will find the perfect plan for you."}</p>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:24 }}>{CONTACT_EMAIL}</div>
          <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" style={{ background:"#25d366", color:"white", textDecoration:"none", borderRadius:10, padding:"12px 28px", fontWeight:700, fontSize:15 }}>WhatsApp</a>
            <button onClick={() => navigate("/app/dashboard")} style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"white", border:"none", borderRadius:10, padding:"12px 28px", fontWeight:700, fontSize:15, cursor:"pointer" }}>
              {isEs ? "Ver Demo" : "See Demo"}
            </button>
          </div>
        </div>

        <div style={{ borderTop:"1px solid rgba(255,255,255,0.1)", padding:"20px 0", display:"flex", justifyContent:"space-between", fontSize:13, color:"rgba(255,255,255,0.4)" }}>
          <span>ERP System - Enterprise Edition</span>
          <div style={{ display:"flex", gap:20 }}>
            <span style={{ cursor:"pointer" }} onClick={() => navigate("/app/dashboard")}>Demo</span>
            <span style={{ cursor:"pointer" }} onClick={() => navigate("/login")}>{isEs ? "Iniciar Sesion" : "Sign In"}</span>
            <span>{CONTACT_EMAIL}</span>
          </div>
        </div>
      </div>
    </div>
  );
}