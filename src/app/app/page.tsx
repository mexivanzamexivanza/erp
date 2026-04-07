import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";

export default async function AppHomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>ERP App (Protected)</h1>
      <p style={{ marginTop: 8 }}>
        Logged in as: <b>{data.user?.email}</b>
      </p>

      <div style={{ marginTop: 16 }}>
        <LogoutButton />
      </div>
    </div>
  );
}
