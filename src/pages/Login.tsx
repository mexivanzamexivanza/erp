import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../auth/AuthProvider";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e5e5e5",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #111",
  background: "#111",
  color: "white",
  cursor: "pointer",
  width: "100%",
};

export default function Login() {
  const nav = useNavigate();
  const { session, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingPwd, setLoadingPwd] = useState(false);
  const [loadingLink, setLoadingLink] = useState(false);

  // If already signed in, go straight to dashboard
  useEffect(() => {
    if (!loading && session) nav("/dashboard", { replace: true });
  }, [loading, session, nav]);

  async function signInPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoadingPwd(true);

    const cleanEmail = email.trim();
    const result = await supabase.auth.signInWithPassword({ email: cleanEmail, password });

    setLoadingPwd(false);

    if (result.error) {
      console.error("signInWithPassword error:", result.error);
      alert(result.error.message);
      return;
    }

    // session might take a tick to propagate; still navigate now
    nav("/dashboard", { replace: true });
  }

  async function sendMagicLink() {
    const cleanEmail = email.trim();
    if (!cleanEmail) return alert("Enter your email first.");

    setLoadingLink(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoadingLink(false);

    if (error) {
      console.error("signInWithOtp error:", error);
      alert(error.message);
      return;
    }

    alert("Magic link sent. Check your email and click the link to sign in.");
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 24, border: "1px solid #eee", borderRadius: 12 }}>
      <h1>Login</h1>
      <p style={{ color: "#666" }}>Use magic link if you are rate-limited.</p>

      <form onSubmit={signInPassword} style={{ display: "grid", gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, color: "#555" }}>Email</label>
          <input style={inputStyle} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div>
          <label style={{ fontSize: 12, color: "#555" }}>Password</label>
          <input
            type="password"
            style={inputStyle}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button style={buttonStyle} disabled={loadingPwd}>
          {loadingPwd ? "Signing in..." : "Sign in with password"}
        </button>
      </form>

      <button
        type="button"
        onClick={async () => {
          await supabase.auth.signOut();
          alert("Signed out. Now sign in again.");
        }}
        style={{ marginTop: 12, width: "100%", padding: "10px 12px", borderRadius: 10 }}
      >
        Reset Auth
      </button>

      <div style={{ height: 12 }} />

      <button
        style={{ ...buttonStyle, background: "transparent", color: "#111" }}
        onClick={sendMagicLink}
        disabled={loadingLink}
      >
        {loadingLink ? "Sending..." : "Send magic link to email"}
      </button>
    </div>
  );
}
