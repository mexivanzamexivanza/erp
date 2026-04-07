export type Product = {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
};

const KEY = "erp.products.v1";

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as Product[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveProducts(products: Product[]) {
  localStorage.setItem(KEY, JSON.stringify(products));
}
