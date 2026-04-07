export type Customer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};

const KEY = "erp.customers.v1";

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function loadCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as Customer[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveCustomers(customers: Customer[]) {
  localStorage.setItem(KEY, JSON.stringify(customers));
}
