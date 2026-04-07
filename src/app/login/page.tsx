"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/app";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>ERP Login</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label>
          Email
          <input
            style={{ width: "100%", padding: 8, marginTop: 4 }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            style={{ width: "100%", padding: 8, marginTop: 4 }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            required
          />
        </label>

        {error && <div style={{ color: "crimson" }}>{error}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{ padding: 10, fontWeight: 600 }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p style={{ marginTop: 12, opacity: 0.8 }}>
        Invite-only: an admin must create your user in Supabase Auth first.
      </p>
    </div>
  );
}
