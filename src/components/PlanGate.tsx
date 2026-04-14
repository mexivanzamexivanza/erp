import { useNavigate } from "react-router-dom";
import { usePlan } from "../lib/planContext";
import type { Plan } from "../lib/planContext";
import type { ReactNode } from "react";

const PLAN_RANK: Record<Plan, number> = { starter: 0, business: 1, enterprise: 2 };
const PLAN_NAMES: Record<Plan, string> = { starter: "Starter", business: "Business", enterprise: "Enterprise" };

export default function PlanGate({ required, children }: { required: Plan; children: ReactNode }) {
  const { plan } = usePlan();
  const navigate = useNavigate();
  if (PLAN_RANK[plan] >= PLAN_RANK[required]) return <>{children}</>;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:400, gap:24, padding:40, textAlign:"center" }}>
      <div style={{ fontSize:72 }}>🔒</div>
      <div style={{ fontSize:26, fontWeight:800 }}>Función bloqueada</div>
      <div style={{ fontSize:16, color:"var(--muted)", maxWidth:440, lineHeight:1.7 }}>
        Esta función requiere el plan <strong>{PLAN_NAMES[required]}</strong> o superior.<br/>
        Tu plan actual es <strong>{PLAN_NAMES[plan]}</strong>.
      </div>
      <button onClick={() => navigate("/pricing")}
        style={{ padding:"14px 36px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#3b82f6,#6366f1)", color:"white", cursor:"pointer", fontSize:16, fontWeight:700 }}>
        💰 Ver Planes y Precios
      </button>
    </div>
  );
}