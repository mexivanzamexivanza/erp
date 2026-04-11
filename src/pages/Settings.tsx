import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getSettings, saveSettings } from "../lib/erpApi";

const TIMEZONES = ["UTC","America/New_York","America/Chicago","America/Denver","America/Los_Angeles","America/Mexico_City","Europe/London","Europe/Paris","Asia/Dubai","Asia/Manila","Asia/Tokyo","Australia/Sydney"];

export default function Settings() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [companyName, setCompanyName]   = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [timezone, setTimezone]         = useState("UTC");
  const [saved, setSaved]               = useState(false);

  useEffect(() => {
    getSettings().then(s => {
      if (s) { setCompanyName(s.company_name ?? ""); setCompanyEmail(s.company_email ?? ""); setTimezone(s.timezone ?? "UTC"); }
      setLoading(false);
    }).catch(e => { alert(e.message); setLoading(false); });
  }, []);

  async function handleSave() {
    if (!companyName.trim()) return alert(t("settings.companyName") + " is required.");
    setSaving(true);
    try {
      await saveSettings({ company_name: companyName, company_email: companyEmail, timezone });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  function switchLanguage(lang: string) {
    i18n.changeLanguage(lang);
    localStorage.setItem("erp_language", lang);
  }

  if (loading) return <div style={{ padding: 24, color: "var(--muted)" }}>{t("common.loading")}</div>;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 className="pageTitle">{t("settings.title")}</h1>
        <div className="pageSub">{t("settings.subtitle")}</div>
      </div>

      {/* Language */}
      <div className="card" style={{ padding: 20, maxWidth: 560 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🌐 {t("settings.languageSettings")}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className={`btn ${i18n.language === "es" ? "btnPrimary" : ""}`}
            onClick={() => switchLanguage("es")}
          >
            🇲🇽 Español
          </button>
          <button
            className={`btn ${i18n.language === "en" ? "btnPrimary" : ""}`}
            onClick={() => switchLanguage("en")}
          >
            🇺🇸 English
          </button>
        </div>
      </div>

      {/* Company Profile */}
      <div className="card" style={{ padding: 20, maxWidth: 560 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>{t("settings.companyProfile")}</div>
        <div style={{ display: "grid", gap: 14 }}>
          {[
            { label: t("settings.companyName") + " *", value: companyName, set: setCompanyName, placeholder: "Acme Inc.", type: "text" },
            { label: t("settings.companyEmail"),        value: companyEmail, set: setCompanyEmail, placeholder: "hello@acme.com", type: "email" },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{f.label}</div>
              <input className="input" type={f.type} placeholder={f.placeholder} value={f.value} onChange={e => f.set(e.target.value)} />
            </div>
          ))}
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("settings.timezone")}</div>
            <select className="input" value={timezone} onChange={e => setTimezone(e.target.value)}>
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn btnPrimary" onClick={handleSave} disabled={saving}>
              {saving ? t("common.saving") : t("settings.saveSettings")}
            </button>
            {saved && <span style={{ color: "var(--success)", fontSize: 14, fontWeight: 600 }}>{t("settings.saved")}</span>}
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="card" style={{ padding: 20, maxWidth: 560 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>{t("settings.systemInfo")}</div>
        <div style={{ display: "grid", gap: 8, fontSize: 13, color: "var(--muted)" }}>
          <div>{t("settings.connected")}</div>
          <div>{t("settings.stack")}</div>
          <div>{t("settings.version")}</div>
        </div>
      </div>
    </div>
  );
}
