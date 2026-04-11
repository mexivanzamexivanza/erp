import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";

type ProductResult = { id: string; sku: string; name: string; stock: number; price: number };

type Props = { onSelect?: (product: ProductResult) => void; };

export default function BarcodeScanner({ onSelect }: Props) {
  const { t } = useTranslation();
  const [open, setOpen]         = useState(false);
  const [input, setInput]       = useState("");
  const [result, setResult]     = useState<ProductResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function search(sku: string) {
    if (!sku.trim()) return;
    setLoading(true); setResult(null); setNotFound(false);
    try {
      const { data } = await supabase.from("products").select("id,sku,name,stock,price").ilike("sku", sku.trim()).limit(1);
      if (data && data.length > 0) { setResult(data[0] as ProductResult); if (onSelect) onSelect(data[0] as ProductResult); }
      else setNotFound(true);
    } catch {} finally { setLoading(false); }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") { search(input); }
  }

  return (
    <>
      <button className="btn" onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
        📷 {t("barcode.scan")}
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setOpen(false)}>
          <div style={{ background: "white", borderRadius: 16, padding: 32, width: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
              📷 {t("barcode.title")}
              <button onClick={() => setOpen(false)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--muted)" }}>✕</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>{t("barcode.enterSku")}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input ref={inputRef} className="input" style={{ flex: 1 }} placeholder="SKU-001"
                  value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} />
                <button className="btn btnPrimary" onClick={() => search(input)} disabled={loading}>
                  {loading ? "..." : t("barcode.search")}
                </button>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>💡 {t("barcode.hint")}</div>
            </div>

            {result && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>✅ {t("barcode.found")}</div>
                  <span style={{ fontFamily: "monospace", background: "#dcfce7", padding: "2px 8px", borderRadius: 6, fontSize: 12 }}>{result.sku}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><div style={{ fontSize: 11, color: "var(--muted)" }}>{t("common.name")}</div><div style={{ fontWeight: 600 }}>{result.name}</div></div>
                  <div><div style={{ fontSize: 11, color: "var(--muted)" }}>{t("inventory.stock")}</div><div style={{ fontWeight: 700, color: result.stock <= 5 ? "#dc2626" : "#16a34a", fontSize: 18 }}>{result.stock}</div></div>
                  <div><div style={{ fontSize: 11, color: "var(--muted)" }}>{t("sales.price")}</div><div style={{ fontWeight: 600 }}>${Number(result.price).toFixed(2)}</div></div>
                </div>
                {onSelect && (
                  <button className="btn btnPrimary" style={{ width: "100%", marginTop: 14, justifyContent: "center" }}
                    onClick={() => { onSelect(result); setOpen(false); setInput(""); setResult(null); }}>
                    {t("barcode.select")}
                  </button>
                )}
              </div>
            )}

            {notFound && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>❌</div>
                <div style={{ fontWeight: 600, color: "#dc2626" }}>{t("barcode.notFound")}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>SKU: "{input}"</div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}