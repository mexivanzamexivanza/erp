import { useMemo, useState } from "react";
import { loadCustomers, saveCustomers, uid } from "../lib/customersStore";
import type { Customer } from "../lib/customersStore";

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
};

const buttonGhost: React.CSSProperties = {
  ...buttonStyle,
  background: "transparent",
  color: "#111",
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>(() => loadCustomers());
  const [q, setQ] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return customers;
    return customers.filter((c) =>
      [c.name, c.email ?? "", c.phone ?? ""].some((v) => v.toLowerCase().includes(s))
    );
  }, [customers, q]);

  function addCustomer() {
    if (!name.trim()) return alert("Customer name required.");
    const c: Customer = { id: uid("cust"), name: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined };
    const next = [c, ...customers];
    setCustomers(next);
    saveCustomers(next);
    setName(""); setEmail(""); setPhone("");
  }

  function removeCustomer(id: string) {
    if (!confirm("Delete customer?")) return;
    const next = customers.filter((c) => c.id !== id);
    setCustomers(next);
    saveCustomers(next);
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <h1 style={{ margin: 0 }}>Customers</h1>
          <div style={{ color: "#666", marginTop: 6 }}>Saved in browser (LocalStorage) for now.</div>
        </div>
        <div style={{ color: "#666" }}>Total: {customers.length}</div>
      </div>

      <section style={{ border: "1px solid #eee", borderRadius: 14, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Add customer</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 12, color: "#555" }}>Name</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#555" }}>Email</label>
            <input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#555" }}>Phone</label>
            <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <button style={buttonStyle} onClick={addCustomer}>Add</button>
        </div>
      </section>

      <section style={{ border: "1px solid #eee", borderRadius: 14, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
          <h2 style={{ marginTop: 0 }}>Customer list</h2>
          <input style={{ ...inputStyle, maxWidth: 320 }} placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {filtered.length === 0 ? (
          <div style={{ color: "#666" }}>No customers found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>Name</th>
                  <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>Email</th>
                  <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>Phone</th>
                  <th style={{ padding: 10, borderBottom: "1px solid #eee" }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }}>{c.name}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }}>{c.email ?? "-"}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }}>{c.phone ?? "-"}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }}>
                      <button style={buttonGhost} onClick={() => removeCustomer(c.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
