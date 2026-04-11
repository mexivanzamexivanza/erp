import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw new Error(authError.message);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDemo() {
    setError("");
    setLoading(true);
    try {
      const { error: e1 } = await supabase.auth.signInWithPassword({ email: "demo@erpsystem.com", password: "demo1234" });
      if (e1) {
        await supabase.auth.signUp({ email: "demo@erpsystem.com", password: "demo1234" });
        await supabase.auth.signInWithPassword({ email: "demo@erpsystem.com", password: "demo1234" });
      }
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)" }}>
      <div style={{ background: "white", borderRadius: 20, padding: 40, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>⚡</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#1e293b" }}>ERP System</div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>Enterprise Edition</div>
        </div>

        <form onSubmit={handleLogin} style={{ display: "grid", gap: 18 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>{t("common.email")}</div>
            <input className="input" type="email" placeholder="admin@company.com"
              value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: "100%", boxSizing: "border-box" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Password</div>
            <input className="input" type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: "100%", boxSizing: "border-box" }} />
          </div>

          {error && (
            <div style={{ background: "#fef2f2", color: "#dc2626", padding: "10px 14px", borderRadius: 10, fontSize: 13, border: "1px solid #fecaca" }}>
              ⚠️ {error}
            </div>
          )}

          <button className="btn btnPrimary" type="submit" disabled={loading}
            style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: 15, fontWeight: 700, borderRadius: 12 }}>
            {loading ? "⏳ Loading..." : "🚀 Ingresar al Sistema"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>or</div>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          </div>

          <button type="button" onClick={handleDemo} disabled={loading}
            style={{ width: "100%", padding: "13px", fontSize: 15, fontWeight: 700, borderRadius: 12, border: "2px solid #2563eb", background: "white", color: "#2563eb", cursor: "pointer" }}>
            ⚡ Try Live Demo
          </button>

          <div style={{ textAlign: "center", fontSize: 11, color: "#94a3b8" }}>
            demo@erpsystem.com &middot; No signup required
          </div>
        </form>
      </div>
    </div>
  );
}