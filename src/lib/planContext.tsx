import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { supabase } from "./supabaseClient";

export type Plan = "starter" | "business" | "enterprise";

interface PlanCtx { plan: Plan; setPlan: (p: Plan) => void; }
const PlanContext = createContext<PlanCtx>({ plan: "starter", setPlan: () => {} });

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<Plan>("starter");
  useEffect(() => {
    supabase.from("settings").select("plan").limit(1).maybeSingle()
      .then(({ data }: { data: any }) => { if (data?.plan) setPlan(data.plan as Plan); });
  }, []);
  return <PlanContext.Provider value={{ plan, setPlan }}>{children}</PlanContext.Provider>;
}

export function usePlan() { return useContext(PlanContext); }