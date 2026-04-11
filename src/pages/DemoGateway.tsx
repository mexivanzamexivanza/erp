import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useState } from "react";

const FEATURES = [
  { icon: "\uD83D\uDCCA", title: "Dashboard & Analytics",    desc: "Real-time KPIs, charts, smart notifications" },
  { icon: "\uD83E\uDDFE", title: "Invoices & Billing",       desc: "Create, send and track invoices with PDF export" },
  { icon: "\uD83D\uDCE6", title: "Inventory Management",     desc: "Products, stock levels, barcode scanner" },
  { icon: "\uD83D\uDC65", title: "CRM & Sales",              desc: "Pipeline, customers, orders, deals" },
  { icon: "\uD83D\uDC64", title: "HR & Payroll",             desc: "Employees, payroll runs, PDF payslips" },
  { icon: "\uD83C\uDFED", title: "Procurement",              desc: "Vendors, purchase orders, receiving" },
  { icon: "\uD83D\uDCAC", title: "Team Messaging",           desc: "Slack-like realtime chat with channels" },
  { icon: "\uD83D\uDD0D", title: "Global Search",            desc: "Search everything with Ctrl+K" },
  { icon: "\uD83D\uDCC5", title: "Calendar & Events",        desc: "Auto-synced from your ERP data" },
  { icon: "\uD83D\uDCC4", title: "PDF Export",               desc: "Print any document instantly" },
  { icon: "\uD83D\uDC51", title: "Role Management",          desc: "Admin, Manager, Employee permissions" },
  { icon: "\uD83C\uDF0D", title: "Multi-language",           desc: "English & Spanish built-in" },
];

const STATS = [
  { value: "27",    label: "Modules"         },
  { value: "100%",  label: "TypeScript"      },
  { value: "∞",     label: "Scalable"        },
  { value: "Live",  label: "Realtime"        },
];

const DEMO_EMAIL    = "demo@erpsystem.com";
const DEMO_PASSWORD = "demo1234";

export default function DemoGateway() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function enterDemo() {
    setLoading(true);
    setError("");
    try {
      // Try sign in first
      let { error: signInErr } = await supabase.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
      // If no account yet, create it
      if (signInErr) {
        const { error: signUpErr } = await supabase.auth.signUp({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
        if (signUpErr) throw new Error(signUpErr.message);
        // Sign in after signup
        const { error: signInErr2 } = await supabase.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
        if (signInErr2) throw new Error(signInErr2.message);
      }
      navigate("/dashboard");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%)", color:"white", fontFamily:"Inter,system-ui,sans-serif" }}>

      {/* Nav */}
      <nav style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 60px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#3b82f6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>
            &#9889;
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:18, letterSpacing:-0.5 }}>ERP System</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:-2 }}>Enterprise Edition</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <button onClick={()=>navigate("/login")}
            style={{ padding:"8px 20px", borderRadius:8, border:"1px solid rgba(255,255,255,0.2)", background:"transparent", color:"white", cursor:"pointer", fontSize:13, fontWeight:600 }}>
            Sign In
          </button>
          <button onClick={enterDemo} disabled={loading}
            style={{ padding:"8px 20px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#3b82f6,#6366f1)", color:"white", cursor:"pointer", fontSize:13, fontWeight:700, opacity:loading?0.7:1 }}>
            {loading ? "Loading..." : "Try Demo"}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign:"center", padding:"80px 40px 60px" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.3)", borderRadius:100, padding:"6px 16px", fontSize:12, fontWeight:600, color:"#a5b4fc", marginBottom:24 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:"#a5b4fc", display:"inline-block" }}></span>
          Live Demo Available — No signup required
        </div>

        <h1 style={{ fontSize:"clamp(36px,6vw,72px)", fontWeight:900, lineHeight:1.1, margin:"0 0 24px", letterSpacing:-2 }}>
          The Complete Business<br />
          <span style={{ background:"linear-gradient(135deg,#3b82f6,#a855f7,#ec4899)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            ERP in One Platform
          </span>
        </h1>

        <p style={{ fontSize:18, color:"rgba(255,255,255,0.6)", maxWidth:560, margin:"0 auto 40px", lineHeight:1.7 }}>
          Manage sales, inventory, finance, HR, and operations — all in one place.
          Built for modern businesses that move fast.
        </p>

        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <button onClick={enterDemo} disabled={loading}
            style={{ padding:"16px 36px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#3b82f6,#6366f1)", color:"white", cursor:"pointer", fontSize:16, fontWeight:700, boxShadow:"0 4px 32px rgba(99,102,241,0.4)", opacity:loading?0.7:1, transition:"all 0.2s" }}>
            {loading ? "&#9203; Entering Demo..." : "\uD83D\uDE80 Enter Live Demo"}
          </button>
          <button onClick={()=>navigate("/login")}
            style={{ padding:"16px 36px", borderRadius:12, border:"1px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.05)", color:"white", cursor:"pointer", fontSize:16, fontWeight:600 }}>
            &#128274; Sign In to Your Account
          </button>
        </div>

        {error && (
          <div style={{ marginTop:16, color:"#fca5a5", fontSize:13 }}>&#9888;&#65039; {error}</div>
        )}

        <div style={{ marginTop:12, fontSize:12, color:"rgba(255,255,255,0.35)" }}>
          Demo login: demo@erpsystem.com / demo1234 — read access to all modules
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"flex", justifyContent:"center", gap:0, maxWidth:600, margin:"0 auto 80px", borderRadius:16, overflow:"hidden", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.03)" }}>
        {STATS.map((s,i) => (
          <div key={i} style={{ flex:1, textAlign:"center", padding:"24px 16px", borderRight:i<STATS.length-1?"1px solid rgba(255,255,255,0.08)":"none" }}>
            <div style={{ fontSize:28, fontWeight:900, color:"#60a5fa" }}>{s.value}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Features grid */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 40px 80px" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <h2 style={{ fontSize:36, fontWeight:800, margin:"0 0 12px", letterSpacing:-1 }}>Everything your business needs</h2>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:16 }}>27 modules, fully integrated, ready to use</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16 }}>
          {FEATURES.map((f,i) => (
            <div key={i}
              style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:24, transition:"all 0.2s", cursor:"default" }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="rgba(99,102,241,0.12)";(e.currentTarget as HTMLElement).style.borderColor="rgba(99,102,241,0.4)";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.04)";(e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.08)";}}>
              <div style={{ fontSize:32, marginBottom:12 }}>{f.icon}</div>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:6 }}>{f.title}</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", margin:"0 40px 80px", borderRadius:24, padding:"60px 40px", textAlign:"center", maxWidth:900, marginLeft:"auto", marginRight:"auto" }}>
        <h2 style={{ fontSize:36, fontWeight:800, margin:"0 0 16px", letterSpacing:-1 }}>Ready to see it in action?</h2>
        <p style={{ color:"rgba(255,255,255,0.6)", marginBottom:32, fontSize:16 }}>
          No credit card. No signup. Just click and explore.
        </p>
        <button onClick={enterDemo} disabled={loading}
          style={{ padding:"18px 48px", borderRadius:14, border:"none", background:"linear-gradient(135deg,#3b82f6,#6366f1)", color:"white", cursor:"pointer", fontSize:18, fontWeight:800, boxShadow:"0 8px 40px rgba(99,102,241,0.5)", opacity:loading?0.7:1 }}>
          {loading ? "Loading..." : "\uD83D\uDE80 Launch Demo Now"}
        </button>
        <div style={{ marginTop:16, fontSize:13, color:"rgba(255,255,255,0.35)" }}>
          demo@erpsystem.com &nbsp;|&nbsp; Password: demo1234
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop:"1px solid rgba(255,255,255,0.08)", padding:"24px 60px", display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:13, color:"rgba(255,255,255,0.3)" }}>
        <div>&#9889; ERP System — Enterprise Edition</div>
        <div style={{ display:"flex", gap:24 }}>
          <span style={{ cursor:"pointer" }} onClick={()=>navigate("/login")}>Sign In</span>
          <span style={{ cursor:"pointer" }} onClick={enterDemo}>Demo</span>
        </div>
      </footer>
    </div>
  );
}