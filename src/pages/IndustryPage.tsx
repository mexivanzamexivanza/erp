import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type Industry =
  | "restaurantes"
  | "tiendas"
  | "manufactura"
  | "clinicas"
  | "agencias"
  | "distribuidoras"
  | "construccion"
  | "servicios";

interface IndustryContent {
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  featuresEs: string[];
  featuresEn: string[];
  icon: string;
}

const CONTENT: Record<Industry, IndustryContent> = {
  restaurantes: {
    icon: "🍽️",
    titleEs: "ERP para Restaurantes",
    titleEn: "ERP for Restaurants",
    descEs: "Administra mesas, pedidos, cocina, inventario de ingredientes, nómina de meseros y más desde una sola plataforma.",
    descEn: "Manage tables, orders, kitchen, ingredient inventory, waiter payroll and more from a single platform.",
    featuresEs: [
      "Control de mesas y pedidos en tiempo real",
      "Gestión de ingredientes e inventario de cocina",
      "Nómina y horarios de personal",
      "Reportes de ventas por turno y producto",
      "Integración con sistemas de punto de venta",
      "Facturas y cobros digitales",
    ],
    featuresEn: [
      "Real-time table and order management",
      "Ingredient and kitchen inventory management",
      "Staff payroll and scheduling",
      "Sales reports by shift and product",
      "Point-of-sale system integration",
      "Digital invoices and billing",
    ],
  },
  tiendas: {
    icon: "🏪",
    titleEs: "ERP para Tiendas",
    titleEn: "ERP for Retail Stores",
    descEs: "Controla tu inventario, ventas, clientes y proveedores con herramientas diseñadas para tiendas de todos los tamaños.",
    descEn: "Control your inventory, sales, customers and suppliers with tools designed for stores of all sizes.",
    featuresEs: [
      "Inventario con código de barras y alertas de stock bajo",
      "Gestión de clientes y programa de lealtad",
      "Órdenes de compra y control de proveedores",
      "Reportes de ventas y margen de ganancia",
      "Múltiples sucursales desde un solo panel",
      "Facturación electrónica",
    ],
    featuresEn: [
      "Barcode inventory with low-stock alerts",
      "Customer management and loyalty program",
      "Purchase orders and supplier control",
      "Sales and profit margin reports",
      "Multiple branches from a single dashboard",
      "Electronic invoicing",
    ],
  },
  manufactura: {
    icon: "🏭",
    titleEs: "ERP para Manufactura",
    titleEn: "ERP for Manufacturing",
    descEs: "Planifica la producción, gestiona materias primas, controla órdenes de trabajo y optimiza tu cadena de suministro.",
    descEn: "Plan production, manage raw materials, control work orders and optimize your supply chain.",
    featuresEs: [
      "Órdenes de trabajo y control de producción",
      "Gestión de materias primas y producto terminado",
      "Listas de materiales (BOM)",
      "Control de calidad y trazabilidad",
      "Logística y envíos",
      "Reportes de eficiencia productiva",
    ],
    featuresEn: [
      "Work orders and production control",
      "Raw materials and finished goods management",
      "Bill of Materials (BOM)",
      "Quality control and traceability",
      "Logistics and shipping",
      "Production efficiency reports",
    ],
  },
  clinicas: {
    icon: "🏥",
    titleEs: "ERP para Clínicas",
    titleEn: "ERP for Clinics",
    descEs: "Administra citas, pacientes, inventario médico, nómina del personal clínico y facturación de servicios de salud.",
    descEn: "Manage appointments, patients, medical inventory, clinical staff payroll and healthcare billing.",
    featuresEs: [
      "Agenda de citas y calendario médico",
      "Expedientes de pacientes",
      "Inventario de medicamentos y suministros",
      "Nómina y gestión de personal clínico",
      "Facturación de servicios médicos",
      "Reportes de ocupación y rentabilidad",
    ],
    featuresEn: [
      "Appointment scheduling and medical calendar",
      "Patient records",
      "Medicine and supply inventory",
      "Clinical staff payroll and management",
      "Medical service billing",
      "Occupancy and profitability reports",
    ],
  },
  agencias: {
    icon: "🏢",
    titleEs: "ERP para Agencias",
    titleEn: "ERP for Agencies",
    descEs: "Gestiona proyectos, clientes, equipos, cotizaciones y facturación para agencias de marketing, diseño, consultoría y más.",
    descEn: "Manage projects, clients, teams, quotes and billing for marketing, design, consulting agencies and more.",
    featuresEs: [
      "CRM y pipeline de clientes",
      "Gestión de proyectos y tareas",
      "Control de horas y productividad",
      "Cotizaciones y contratos",
      "Facturación por proyecto o retainer",
      "Reportes financieros por cliente",
    ],
    featuresEn: [
      "CRM and client pipeline",
      "Project and task management",
      "Time tracking and productivity",
      "Quotes and contracts",
      "Billing by project or retainer",
      "Financial reports by client",
    ],
  },
  distribuidoras: {
    icon: "🚛",
    titleEs: "ERP para Distribuidoras",
    titleEn: "ERP for Distributors",
    descEs: "Optimiza tu red de distribución, rutas de entrega, gestión de pedidos y relaciones con clientes y proveedores.",
    descEn: "Optimize your distribution network, delivery routes, order management and relationships with customers and suppliers.",
    featuresEs: [
      "Gestión de pedidos y rutas de entrega",
      "Control de flota y logística",
      "Inventario multi-almacén",
      "Gestión de clientes y créditos",
      "Órdenes de compra a proveedores",
      "Reportes de cobertura y rentabilidad",
    ],
    featuresEn: [
      "Order management and delivery routes",
      "Fleet and logistics control",
      "Multi-warehouse inventory",
      "Customer and credit management",
      "Supplier purchase orders",
      "Coverage and profitability reports",
    ],
  },
  construccion: {
    icon: "🏗️",
    titleEs: "ERP para Construcción",
    titleEn: "ERP for Construction",
    descEs: "Controla presupuestos de obra, materiales, subcontratistas, avance de proyectos y flujo de efectivo de cada proyecto.",
    descEn: "Control construction budgets, materials, subcontractors, project progress and cash flow for each project.",
    featuresEs: [
      "Presupuestos y control de costos por obra",
      "Gestión de materiales y almacén en sitio",
      "Control de subcontratistas y contratos",
      "Avance y cronograma de proyectos",
      "Nómina de trabajadores por obra",
      "Reportes financieros por proyecto",
    ],
    featuresEn: [
      "Budgets and cost control per project",
      "On-site materials and warehouse management",
      "Subcontractor and contract control",
      "Project progress and scheduling",
      "Worker payroll per project",
      "Financial reports by project",
    ],
  },
  servicios: {
    icon: "🛠️",
    titleEs: "ERP para Empresas de Servicios",
    titleEn: "ERP for Service Companies",
    descEs: "Administra órdenes de servicio, técnicos, contratos, facturación y atención al cliente para empresas de servicios.",
    descEn: "Manage service orders, technicians, contracts, billing and customer service for service companies.",
    featuresEs: [
      "Órdenes de servicio y agenda de técnicos",
      "CRM y seguimiento de clientes",
      "Contratos y mantenimientos recurrentes",
      "Facturación y cobros",
      "Control de inventario de refacciones",
      "Reportes de rendimiento y satisfacción",
    ],
    featuresEn: [
      "Service orders and technician scheduling",
      "CRM and customer follow-up",
      "Recurring contracts and maintenance",
      "Billing and collections",
      "Spare parts inventory control",
      "Performance and satisfaction reports",
    ],
  },
};

export default function IndustryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [isEs, setIsEs] = useState(true);
  const navigate = useNavigate();
  const content = CONTENT[slug as Industry];

  if (!content) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 20 }}>Industria no encontrada</div>
          <button onClick={() => navigate("/pricing")} style={{ marginTop: 24, padding: "10px 24px", borderRadius: 8, border: "none", background: "#3b82f6", color: "white", cursor: "pointer", fontSize: 15 }}>
            Ver Planes
          </button>
        </div>
      </div>
    );
  }

  const features = isEs ? content.featuresEs : content.featuresEn;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)", color: "white", fontFamily: "system-ui,sans-serif" }}>
      {/* Navbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 40px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("/")}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#3b82f6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "white", fontSize: 16 }}>E</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>ERP System</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Enterprise Edition</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={() => setIsEs(prev => !prev)}
            style={{ padding: "6px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.07)", color: "white", cursor: "pointer", fontSize: 13 }}
          >
            {isEs ? "🇺🇸 English" : "🇲🇽 Español"}
          </button>
          <span style={{ cursor: "pointer", fontSize: 14 }} onClick={() => navigate("/pricing")}>{isEs ? "Ver Precios" : "View Pricing"}</span>
          <span style={{ cursor: "pointer", fontSize: 14 }} onClick={() => navigate("/app/dashboard")}>Demo</span>
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "80px 40px 60px" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{content.icon}</div>
        <h1 style={{ fontSize: 42, fontWeight: 900, margin: "0 0 20px", background: "linear-gradient(135deg,#3b82f6,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {isEs ? content.titleEs : content.titleEn}
        </h1>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", maxWidth: 600, margin: "0 auto 40px", lineHeight: 1.7 }}>
          {isEs ? content.descEs : content.descEn}
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <button
            onClick={() => navigate("/app/dashboard")}
            style={{ padding: "14px 32px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#6366f1,#3b82f6)", color: "white", cursor: "pointer", fontSize: 16, fontWeight: 700 }}
          >
            🚀 {isEs ? "Probar Demo" : "Try Demo"}
          </button>
          <button
            onClick={() => navigate("/pricing")}
            style={{ padding: "14px 32px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.07)", color: "white", cursor: "pointer", fontSize: 16, fontWeight: 700 }}
          >
            {isEs ? "Ver Planes" : "View Plans"}
          </button>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 40px 80px" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 28, textAlign: "center" }}>
          {isEs ? "¿Qué incluye?" : "What's included?"}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 }}>
          {features.map((feat, idx) => (
            <div
              key={idx}
              style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "16px 20px" }}
            >
              <span style={{ color: "#22c55e", fontWeight: 900, fontSize: 18, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 15, color: "rgba(255,255,255,0.85)" }}>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: "center", padding: "0 40px 80px" }}>
        <div style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 16, padding: "40px 32px", maxWidth: 560, margin: "0 auto" }}>
          <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>
            {isEs ? "¿Listo para empezar?" : "Ready to get started?"}
          </div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 15, marginBottom: 28 }}>
            {isEs ? "Prueba la demo gratis, sin tarjeta de crédito." : "Try the demo for free, no credit card required."}
          </div>
          <button
            onClick={() => navigate("/app/dashboard")}
            style={{ padding: "14px 36px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#6366f1,#3b82f6)", color: "white", cursor: "pointer", fontSize: 16, fontWeight: 700 }}
          >
            🚀 {isEs ? "Entrar a la Demo" : "Enter Demo"}
          </button>
        </div>
      </div>
    </div>
  );
}
