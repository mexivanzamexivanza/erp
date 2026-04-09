import { useEffect, useMemo, useState } from "react";
import { createVendor, listVendors } from "../lib/erpApi";
import type { VendorRow } from "../lib/erpApi";

export default function Vendors() {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      setVendors(await listVendors());
    } catch (e: any) {
      alert(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return vendors;
    return vendors.filter((v) =>
      [v.name, v.email ?? "", v.phone ?? ""].some((x) => x.toLowerCase().includes(s))
    );
  }, [vendors, q]);

  async function addVendor() {
    if (!name.trim()) return alert("Vendor name required.");
    try {
      await createVendor({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });
      setName(""); setEmail(""); setPhone(""); setAddress("");
      await refresh();
    } catch (e: any) {
      alert(e.message ?? String(e));
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <h1 className="pageTitle">Vendors</h1>
          <div className="pageSub">Suppliers you buy from.</div>
        </div>
        <div className="badge">Total: {vendors.length}</div>
      </div>

      <section className="card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Add vendor</div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1.4fr auto", gap: 10, alignItems: "end" }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Name</div>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Email</div>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Phone</div>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Address</div>
            <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <button className="btn btnPrimary" onClick={addVendor}>Add</button>
        </div>
      </section>

      <section className="card" style={{ padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 800 }}>Vendor list</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input className="input" style={{ width: 280 }} placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn" onClick={refresh}>{loading ? "Loading..." : "Refresh"}</button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          {loading ? (
            <div style={{ color: "var(--muted)" }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ color: "var(--muted)" }}>No vendors found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Address</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v) => (
                    <tr key={v.id}>
                      <td>{v.name}</td>
                      <td>{v.email ?? ""}</td>
                      <td>{v.phone ?? ""}</td>
                      <td>{v.address ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
