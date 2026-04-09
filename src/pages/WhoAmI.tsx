import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function WhoAmI() {
  const [text, setText] = useState("loading...");

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const { data: user } = await supabase.auth.getUser();
      setText(JSON.stringify({ session: sess.session, user: user.user }, null, 2));
      console.log("WHOAMI session:", sess.session);
      console.log("WHOAMI user:", user.user);
    })();
  }, []);

  return (
    <div className="card" style={{ padding: 14 }}>
      <h1 className="pageTitle">WhoAmI</h1>
      <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{text}</pre>
    </div>
  );
}
