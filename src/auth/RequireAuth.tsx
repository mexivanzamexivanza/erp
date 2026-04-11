import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Props = { children: React.ReactNode; requiredRole?: "admin" | "manager" | "employee" };

export default function RequireAuth({ children, requiredRole }: Props) {
  const { user, loading } = useAuth();
  const [role, setRole]   = useState<string | null>(null);
  const [checking, setChecking] = useState(!!requiredRole);

  useEffect(() => {
    if (!requiredRole || !user?.email) { setChecking(false); return; }
    supabase.from("user_roles").select("role").eq("email", user.email).single()
      .then(({ data }) => { setRole(data?.role ?? "employee"); setChecking(false); });
  }, [user?.email, requiredRole]);

  if (loading || checking) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#1e3a5f,#2563eb)" }}>
      <div style={{ color:"white", fontSize:18, fontWeight:600 }}>&#9889; Cargando...</div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole === "admin" && role !== "admin")
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
        <div style={{ fontSize:48 }}>&#128683;</div>
        <div style={{ fontSize:20, fontWeight:700 }}>Access Denied</div>
        <div style={{ color:"var(--muted)" }}>You need admin privileges to view this page.</div>
        <a href="/dashboard" style={{ color:"var(--primary)", textDecoration:"none", fontWeight:600 }}>&#8592; Back to Dashboard</a>
      </div>
    );

  return <>{children}</>;
}