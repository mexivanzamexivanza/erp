import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

type Result = { id: string; label: string; sub: string; icon: string; link: string };

export default function GlobalSearch() {
  const [open, setOpen]         = useState(false);
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<Result[]>([]);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState(0);
  const [counts, setCounts]     = useState<Record<string,number>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load counts for the chips on mount
  useEffect(() => {
    async function loadCounts() {
      const [c, p, v, i, e, pr] = await Promise.all([
        supabase.from("customers").select("id", { count:"exact", head:true }),
        supabase.from("products").select("id",  { count:"exact", head:true }),
        supabase.from("vendors").select("id",   { count:"exact", head:true }),
        supabase.from("invoices").select("id",  { count:"exact", head:true }),
        supabase.from("employees").select("id", { count:"exact", head:true }),
        supabase.from("projects").select("id",  { count:"exact", head:true }),
      ]);
      setCounts({ customers: c.count??0, products: p.count??0, vendors: v.count??0, invoices: i.count??0, employees: e.count??0, projects: pr.count??0 });
    }
    loadCounts();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault(); setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") { setOpen(false); setQuery(""); setResults([]); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!query.trim() || query.length < 1) { setResults([]); return; }
    const timer = setTimeout(() => doSearch(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  async function doSearch(q: string) {
    setLoading(true);
    try {
      const s = "%" + q + "%";
      const [customers, products, vendors, invoices, orders, leads, employees, projects] = await Promise.all([
        supabase.from("customers").select("id,name,email").ilike("name", s).limit(4),
        supabase.from("products").select("id,name,sku").or(`name.ilike.${s},sku.ilike.${s}`).limit(4),
        supabase.from("vendors").select("id,name,contact_email").ilike("name", s).limit(4),
        supabase.from("invoices").select("id,invoice_number,customer_name").or(`invoice_number.ilike.${s},customer_name.ilike.${s}`).limit(4),
        supabase.from("sales_orders").select("id,order_number,customer_name").or(`order_number.ilike.${s},customer_name.ilike.${s}`).limit(4),
        supabase.from("crm_leads").select("id,name,company").or(`name.ilike.${s},company.ilike.${s}`).limit(4),
        supabase.from("employees").select("id,name,department,position").or(`name.ilike.${s},department.ilike.${s},position.ilike.${s}`).limit(4),
        supabase.from("projects").select("id,name,status").ilike("name", s).limit(4),
      ]);

      const res: Result[] = [
        ...(customers.data  ?? []).map((r: any) => ({ id:r.id, label:r.name,                            sub: r.email ?? "Cliente",                      icon:"\uD83E\uDD1D", link:"/customers" })),
        ...(products.data   ?? []).map((r: any) => ({ id:r.id, label:r.name,                            sub: "SKU: " + r.sku,                           icon:"\uD83D\uDCE6", link:"/inventory" })),
        ...(vendors.data    ?? []).map((r: any) => ({ id:r.id, label:r.name,                            sub: r.contact_email ?? "Proveedor",            icon:"\uD83C\uDFED", link:"/vendors"   })),
        ...(invoices.data   ?? []).map((r: any) => ({ id:r.id, label:r.invoice_number ?? r.customer_name, sub: "Factura \u2022 " + r.customer_name,    icon:"\uD83E\uDDFE", link:"/invoices"  })),
        ...(orders.data     ?? []).map((r: any) => ({ id:r.id, label:r.order_number ?? r.customer_name,   sub: "Orden \u2022 " + r.customer_name,      icon:"\uD83D\uDED2", link:"/sales"     })),
        ...(leads.data      ?? []).map((r: any) => ({ id:r.id, label:r.name,                            sub: r.company ?? "Lead CRM",                   icon:"\uD83D\uDCE3", link:"/crm"       })),
        ...(employees.data  ?? []).map((r: any) => ({ id:r.id, label:r.name,                            sub: [r.position, r.department].filter(Boolean).join(" \u2022 ") || "Empleado", icon:"\uD83D\uDC64", link:"/employees" })),
        ...(projects.data   ?? []).map((r: any) => ({ id:r.id, label:r.name,                            sub: "Proyecto \u2022 " + r.status,             icon:"\uD83D\uDCCC", link:"/projects"  })),
      ];
      setResults(res);
      setSelected(0);
    } catch (err) { console.error(err); setResults([]); }
    finally { setLoading(false); }
  }

  // Load ALL records for a category chip click
  async function loadAll(table: string, link: string, icon: string, labelField: string, subFn: (r:any)=>string) {
    setLoading(true);
    try {
      const { data } = await supabase.from(table).select("*").limit(20);
      setResults((data ?? []).map((r: any) => ({ id: r.id, label: r[labelField] ?? "—", sub: subFn(r), icon, link })));
      setSelected(0);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }

  function go(link: string) { navigate(link); setOpen(false); setQuery(""); setResults([]); }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s+1, results.length-1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected(s => Math.max(s-1, 0)); }
    if (e.key === "Enter" && results[selected]) go(results[selected].link);
  }

  const chips = [
    { label:"Clientes",    icon:"\uD83E\uDD1D", count:counts.customers,  action:()=>loadAll("customers","  /customers","\uD83E\uDD1D","name",  r=>r.email??"Cliente") },
    { label:"Empleados",   icon:"\uD83D\uDC64", count:counts.employees,  action:()=>loadAll("employees", "/employees","\uD83D\uDC64","name",  r=>[r.position,r.department].filter(Boolean).join(" \u2022 ")||"Empleado") },
    { label:"Productos",   icon:"\uD83D\uDCE6", count:counts.products,   action:()=>loadAll("products",  "/inventory", "\uD83D\uDCE6","name",  r=>"SKU: "+r.sku) },
    { label:"Facturas",    icon:"\uD83E\uDDFE", count:counts.invoices,   action:()=>loadAll("invoices",  "/invoices",  "\uD83E\uDDFE","invoice_number", r=>r.customer_name??"Factura") },
    { label:"Proveedores", icon:"\uD83C\uDFED", count:counts.vendors,    action:()=>loadAll("vendors",   "/vendors",   "\uD83C\uDFED","name",  r=>r.contact_email??"Proveedor") },
    { label:"Proyectos",   icon:"\uD83D\uDCCC", count:counts.projects,   action:()=>loadAll("projects",  "/projects",  "\uD83D\uDCCC","name",  r=>"Proyecto \u2022 "+r.status) },
  ];

  return (
    <>
      <button onClick={() => { setOpen(true); setTimeout(()=>inputRef.current?.focus(),50); }}
        style={{ display:"flex",alignItems:"center",gap:8,padding:"6px 14px",borderRadius:8,border:"1px solid var(--border)",background:"white",cursor:"pointer",fontSize:13,color:"var(--muted)",minWidth:200 }}>
        <span>&#128269;</span>
        <span style={{ flex:1,textAlign:"left" }}>Search everything...</span>
        <span style={{ fontSize:11,background:"#f1f5f9",border:"1px solid var(--border)",borderRadius:4,padding:"1px 6px",fontFamily:"monospace" }}>Ctrl+K</span>
      </button>

      {open && (
        <div style={{ position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:80 }}
          onClick={()=>{ setOpen(false); setQuery(""); setResults([]); }}>
          <div style={{ background:"white",borderRadius:16,width:600,maxHeight:520,boxShadow:"0 20px 60px rgba(0,0,0,0.25)",overflow:"hidden",display:"flex",flexDirection:"column" }}
            onClick={e=>e.stopPropagation()}>

            {/* Input */}
            <div style={{ padding:"14px 18px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:10,flexShrink:0 }}>
              <span style={{ fontSize:18 }}>&#128269;</span>
              <input ref={inputRef}
                style={{ flex:1,border:"none",outline:"none",fontSize:16,background:"transparent" }}
                placeholder="Buscar por nombre, SKU, factura, empleado..."
                value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={onKeyDown} autoComplete="off" />
              {loading && <span style={{ fontSize:13,color:"var(--muted)" }}>&#9203;</span>}
              <span style={{ fontSize:11,background:"#f1f5f9",border:"1px solid var(--border)",borderRadius:5,padding:"2px 8px",color:"var(--muted)",cursor:"pointer" }}
                onClick={()=>{ setOpen(false); setQuery(""); setResults([]); }}>ESC</span>
            </div>

            {/* Results */}
            <div style={{ overflowY:"auto",flex:1 }}>
              {results.length > 0 && results.map((r,i)=>(
                <div key={r.id+i} onClick={()=>go(r.link)}
                  style={{ padding:"11px 20px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",borderBottom:"1px solid #f8fafc",background:i===selected?"#eff6ff":"white" }}
                  onMouseEnter={()=>setSelected(i)}>
                  <span style={{ fontSize:22,flexShrink:0 }}>{r.icon}</span>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontWeight:600,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.label}</div>
                    <div style={{ fontSize:12,color:"var(--muted)" }}>{r.sub}</div>
                  </div>
                  <span style={{ fontSize:11,color:"var(--muted)",background:"#f8fafc",borderRadius:6,padding:"2px 8px",flexShrink:0,border:"1px solid var(--border)" }}>{r.link.replace("/","")}</span>
                </div>
              ))}

              {/* No results */}
              {query.length >= 1 && !loading && results.length === 0 && (
                <div style={{ padding:40,textAlign:"center",color:"var(--muted)" }}>
                  <div style={{ fontSize:32,marginBottom:8 }}>&#128269;</div>
                  <div style={{ fontWeight:600,marginBottom:4 }}>Sin resultados para "{query}"</div>
                  <div style={{ fontSize:13 }}>Prueba con un nombre real de cliente, producto o empleado</div>
                </div>
              )}

              {/* Chips — browse by category */}
              {!query.trim() && (
                <div style={{ padding:20 }}>
                  <div style={{ fontSize:11,color:"var(--muted)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:12 }}>
                    Explorar por categoría
                  </div>
                  <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
                    {chips.map((h,i)=>(
                      <button key={i} onClick={h.action}
                        style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,border:"1px solid var(--border)",background:"#f8fafc",cursor:"pointer",fontSize:13,fontWeight:500 }}>
                        {h.icon} {h.label}
                        {h.count != null && <span style={{ background:"var(--primary)",color:"white",borderRadius:10,fontSize:10,fontWeight:700,padding:"1px 6px",marginLeft:2 }}>{h.count}</span>}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop:16,fontSize:12,color:"var(--muted)" }}>
                    &#128161; Escribe al menos 1 letra para buscar en tiempo real
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding:"8px 20px",borderTop:"1px solid var(--border)",display:"flex",gap:16,fontSize:11,color:"var(--muted)",background:"#fafafa",flexShrink:0 }}>
              <span>&#8593;&#8595; navegar</span><span>&#8629; seleccionar</span><span>ESC cerrar</span>
              {results.length > 0 && <span style={{ marginLeft:"auto" }}>{results.length} resultado{results.length !== 1 ? "s" : ""}</span>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}