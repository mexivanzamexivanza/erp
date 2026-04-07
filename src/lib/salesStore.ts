export type SaleLine = {
  id: string;
  sku: string;
  name: string;
  qty: number;
  price: number; // per unit
};

export type Sale = {
  id: string;
  customerName: string;
  createdAt: string; // ISO
  lines: SaleLine[];
};

const KEY = "erp.sales.v1";

export function loadSales(): Sale[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as Sale[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveSales(sales: Sale[]) {
  localStorage.setItem(KEY, JSON.stringify(sales));
}

export function saleTotal(sale: Sale) {
  return sale.lines.reduce((sum, l) => sum + l.qty * l.price, 0);
}

export function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}
