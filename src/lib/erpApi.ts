import { supabase } from "./supabaseClient";

export type UUID = string;

/* ---------------- Shared helpers ---------------- */

function toNumber(x: any, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

/* ---------------- Core tables ---------------- */

export type ProductRow = {
  id: UUID;
  org_id: UUID;
  sku: string;
  name: string;
  stock: number;
  created_at: string;
};

export type VendorRow = {
  id: UUID;
  org_id: UUID;
  name: string;
  created_at: string;
};

export type PurchaseOrderRow = {
  id: UUID;
  org_id: UUID;
  vendor_id: UUID | null;
  vendor_name: string;
  status: string;
  notes: string | null;
  created_by: UUID;
  created_at: string;
};

export type PurchaseOrderLineRow = {
  id: UUID;
  org_id: UUID;
  purchase_order_id: UUID;
  product_id: UUID;
  sku: string;
  name: string;
  qty: number;
  unit_cost: number;
  received_qty: number;
  created_at: string;
};

export type SalesOrderRow = {
  id: UUID;
  org_id: UUID;
  customer_id: UUID | null;
  customer_name: string;
  status: string;
  created_by: UUID;
  created_at: string;
};

export type InvoiceRow = {
  id: UUID;
  org_id: UUID;
  sales_order_id: UUID | null;
  customer_id: UUID | null;
  customer_name: string;
  status: string;
  currency: string;
  subtotal: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  issued_at: string;
  due_at: string | null;
  created_by: UUID;
  created_at: string;
};

export type InventoryMovementRow = {
  id: UUID;
  org_id: UUID;
  product_id: UUID;
  qty_delta: number;
  reason: string;
  note: string | null;
  created_by: UUID;
  created_at: string;
};

/* ---------------- Purchasing workflow RPCs ---------------- */

export async function approvePurchaseOrder(po_id: UUID) {
  const { data, error } = await supabase.rpc("approve_purchase_order", { p_po_id: po_id });
  if (error) throw new Error(error.message);
  return data;
}

export async function cancelPurchaseOrder(po_id: UUID, note?: string) {
  const { data, error } = await supabase.rpc("cancel_purchase_order", { p_po_id: po_id, p_note: note ?? null });
  if (error) throw new Error(error.message);
  return data;
}

/* ---------------- Stock movements ---------------- */

export async function listInventoryMovements(): Promise<InventoryMovementRow[]> {
  const { data, error } = await supabase
    .from("inventory_movements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);
  return (data ?? []) as InventoryMovementRow[];
}

/* ---------------- Products ---------------- */

export async function listProducts(): Promise<ProductRow[]> {
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProductRow[];
}

/* ---------------- Vendors ---------------- */

export async function listVendors(): Promise<VendorRow[]> {
  const { data, error } = await supabase.from("vendors").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as VendorRow[];
}

/* ---------------- Purchase Orders ---------------- */

export async function listPurchaseOrders(): Promise<PurchaseOrderRow[]> {
  const { data, error } = await supabase.from("purchase_orders").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as PurchaseOrderRow[];
}

export async function listPurchaseOrderLines(purchase_order_id: UUID): Promise<PurchaseOrderLineRow[]> {
  const { data, error } = await supabase
    .from("purchase_order_lines")
    .select("*")
    .eq("purchase_order_id", purchase_order_id)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as PurchaseOrderLineRow[];
}

export async function createPurchaseOrder(input: {
  vendor_id?: UUID | null;
  vendor_name: string;
  notes?: string;
  lines: Array<{ product_id: UUID; sku: string; name: string; qty: number; unit_cost: number }>;
}) {
  const payload = {
    vendor_id: input.vendor_id ?? null,
    vendor_name: input.vendor_name,
    notes: input.notes ?? null,
    lines: input.lines.map((l) => ({
      product_id: l.product_id,
      sku: l.sku,
      name: l.name,
      qty: toNumber(l.qty),
      unit_cost: toNumber(l.unit_cost),
    })),
  };

  // keep using your existing RPC name (assumed)
  const { data, error } = await supabase.rpc("create_purchase_order_atomic", payload);
  if (error) throw new Error(error.message);
  return data;
}

/* ---------------- Receiving ---------------- */

export async function receivePurchaseOrder(po_id: UUID, lines: Array<{ po_line_id: UUID; receive_qty: number }>) {
  const payloadLines = lines.map((l) => ({ po_line_id: l.po_line_id, receive_qty: toNumber(l.receive_qty) }));
  const { data, error } = await supabase.rpc("receive_purchase_order_atomic", { p_po_id: po_id, p_lines: payloadLines });
  if (error) throw new Error(error.message);
  return data;
}

/* ---------------- Invoices & Payments ---------------- */

export async function listInvoices(): Promise<InvoiceRow[]> {
  const { data, error } = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as InvoiceRow[];
}

export async function createInvoiceFromSalesOrder(input: { sales_order_id: UUID; due_at?: string | null }) {
  const { data, error } = await supabase.rpc("create_invoice_from_sales_order", {
    p_sales_order_id: input.sales_order_id,
    p_due_at: input.due_at ?? null,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function recordPayment(input: { invoice_id: UUID; amount: number; method?: string; note?: string }) {
  const { data, error } = await supabase.rpc("record_payment", {
    p_invoice_id: input.invoice_id,
    p_amount: toNumber(input.amount),
    p_method: input.method ?? "cash",
    p_note: input.note ?? null,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function voidInvoice(input: { invoice_id: UUID; note?: string }) {
  const { data, error } = await supabase.rpc("void_invoice", {
    p_invoice_id: input.invoice_id,
    p_note: input.note ?? null,
  });
  if (error) throw new Error(error.message);
  return data;
}

/* ---------------- Audit Log ---------------- */

export type AuditLogRow = {
  id: UUID;
  org_id: UUID;
  actor_user_id: UUID | null;
  action: string;
  entity_type: string;
  entity_id: UUID | null;
  metadata: any;
  created_at: string;
};

export async function listAuditLog(limit = 200): Promise<AuditLogRow[]> {
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as AuditLogRow[];
}

/* ---------------- AR aging ---------------- */

export type ARAgingRow = {
  org_id: UUID;
  invoice_id: UUID;
  customer_name: string;
  status: string;
  issued_at: string;
  due_at: string | null;
  total: number;
  amount_paid: number;
  balance_due: number;
  days_past_due: number;
  bucket: string;
};

export async function listARAging(): Promise<ARAgingRow[]> {
  const { data, error } = await supabase
    .from("ar_aging")
    .select("*")
    .order("days_past_due", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ARAgingRow[];
}

/* ---------------- AP (Bills) ---------------- */

export type BillRow = {
  id: UUID;
  org_id: UUID;
  purchase_order_id: UUID | null;
  vendor_id: UUID | null;
  vendor_name: string;
  status: string;
  currency: string;
  subtotal: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  billed_at: string;
  due_at: string | null;
  created_by: UUID;
  created_at: string;
};

export type BillLineRow = {
  id: UUID;
  org_id: UUID;
  bill_id: UUID;
  product_id: UUID | null;
  sku: string;
  name: string;
  qty: number;
  unit_cost: number;
  line_total: number;
  created_at: string;
};

export type BillPaymentRow = {
  id: UUID;
  org_id: UUID;
  bill_id: UUID;
  amount: number;
  method: string;
  note: string | null;
  paid_at: string;
  created_by: UUID;
  created_at: string;
};

export type APAgingRow = {
  org_id: UUID;
  bill_id: UUID;
  vendor_name: string;
  status: string;
  billed_at: string;
  due_at: string | null;
  total: number;
  amount_paid: number;
  balance_due: number;
  days_past_due: number;
  bucket: string;
};

export async function listBills(): Promise<BillRow[]> {
  const { data, error } = await supabase.from("bills").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as BillRow[];
}

export async function listBillLines(bill_id: UUID): Promise<BillLineRow[]> {
  const { data, error } = await supabase
    .from("bill_lines")
    .select("*")
    .eq("bill_id", bill_id)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as BillLineRow[];
}

export async function listBillPayments(bill_id: UUID): Promise<BillPaymentRow[]> {
  const { data, error } = await supabase
    .from("bill_payments")
    .select("*")
    .eq("bill_id", bill_id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as BillPaymentRow[];
}

export async function createBillFromPurchaseOrder(input: { purchase_order_id: UUID; due_at?: string | null }) {
  const { data, error } = await supabase.rpc("create_bill_from_purchase_order", {
    p_purchase_order_id: input.purchase_order_id,
    p_due_at: input.due_at ?? null,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function createBillManual(input: {
  vendor_id?: UUID | null;
  vendor_name: string;
  due_at?: string | null;
  lines: Array<{ product_id?: UUID | null; sku: string; name: string; qty: number; unit_cost: number }>;
}) {
  const lines = input.lines.map((l) => ({
    product_id: l.product_id ?? null,
    sku: l.sku,
    name: l.name,
    qty: toNumber(l.qty),
    unit_cost: toNumber(l.unit_cost),
  }));

  const { data, error } = await supabase.rpc("create_bill_manual", {
    p_vendor_id: input.vendor_id ?? null,
    p_vendor_name: input.vendor_name,
    p_lines: lines,
    p_due_at: input.due_at ?? null,
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function recordBillPayment(input: { bill_id: UUID; amount: number; method?: string; note?: string }) {
  const { data, error } = await supabase.rpc("record_bill_payment", {
    p_bill_id: input.bill_id,
    p_amount: toNumber(input.amount),
    p_method: input.method ?? "bank",
    p_note: input.note ?? null,
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function voidBill(input: { bill_id: UUID; note?: string }) {
  const { data, error } = await supabase.rpc("void_bill", {
    p_bill_id: input.bill_id,
    p_note: input.note ?? null,
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function listAPAging(): Promise<APAgingRow[]> {
  const { data, error } = await supabase.from("ap_aging").select("*").order("days_past_due", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as APAgingRow[];
}

/* ---------------- Customers ---------------- */

export type CustomerRow = {
  id: UUID;
  org_id: UUID;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
};

export async function listCustomers(): Promise<CustomerRow[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as CustomerRow[];
}

export async function createCustomer(input: { name: string; email?: string; phone?: string }) {
  const { data, error } = await supabase
    .from("customers")
    .insert({
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as CustomerRow;
}

export async function deleteCustomer(customer_id: UUID) {
  const { error } = await supabase.from("customers").delete().eq("id", customer_id);
  if (error) throw new Error(error.message);
}


/* ---------------- Compatibility exports for pages ---------------- */

/* Products */
export async function createProduct(input: { sku: string; name: string; stock?: number }) {
  const { data, error } = await supabase
    .from("products")
    .insert({
      sku: input.sku,
      name: input.name,
      stock: Number(input.stock ?? 0),
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as ProductRow;
}

/* Vendors */
export async function createVendor(input: { name: string }) {
  const { data, error } = await supabase
    .from("vendors")
    .insert({ name: input.name })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as VendorRow;
}

/* Sales */
export async function listSalesOrders(): Promise<SalesOrderRow[]> {
  const { data, error } = await supabase
    .from("sales_orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as SalesOrderRow[];
}

export async function createSalesOrder(input: {
  customer_id?: UUID | null;
  customer_name: string;
  lines: Array<{ product_id: UUID; sku: string; name: string; qty: number; price: number }>;
}) {
  const payload = {
    p_customer_id: input.customer_id ?? null,
    p_customer_name: input.customer_name,
    p_lines: input.lines.map((l) => ({
      product_id: l.product_id,
      sku: l.sku,
      name: l.name,
      qty: Number(l.qty),
      price: Number(l.price),
    })),
  };

  const { data, error } = await supabase.rpc("create_sales_order_atomic", payload);
  if (error) throw new Error(error.message);
  return data;
}

/* Inventory movements */
export async function createInventoryMovement(input: {
  product_id: UUID;
  qty_delta: number;
  reason: string;
  note?: string;
}) {
  const { data, error } = await supabase.rpc("apply_inventory_movement", {
    p_product_id: input.product_id,
    p_qty_delta: Number(input.qty_delta),
    p_reason: input.reason,
    p_note: input.note ?? null,
  });

  if (error) throw new Error(error.message);
  return data;
}

/* Invoices detail types (Invoices.tsx imports these) */
export type InvoiceLineRow = {
  id: UUID;
  org_id: UUID;
  invoice_id: UUID;
  product_id: UUID | null;
  sku: string;
  name: string;
  qty: number;
  price: number;
  line_total: number;
  created_at: string;
};

export type PaymentRow = {
  id: UUID;
  org_id: UUID;
  invoice_id: UUID;
  amount: number;
  method: string;
  note: string | null;
  paid_at: string;
  created_by: UUID;
  created_at: string;
};

export async function listInvoiceLines(invoice_id: UUID): Promise<InvoiceLineRow[]> {
  const { data, error } = await supabase
    .from("invoice_lines")
    .select("*")
    .eq("invoice_id", invoice_id)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as InvoiceLineRow[];
}

export async function listPayments(invoice_id: UUID): Promise<PaymentRow[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("invoice_id", invoice_id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PaymentRow[];
}




