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
  const { data, error } = await supabase.rpc("cancel_purchase_order", { p_po_id: input.po_id, p_note: note ?? null });
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

export async function receivePurchaseOrder(input: { po_id: UUID; lines: Array<{ po_line_id: UUID; receive_qty: number }> }) {
  const payloadLines = input.lines.map((l) => ({ po_line_id: l.po_line_id, receive_qty: toNumber(l.receive_qty) }));
  const { data, error } = await supabase.rpc("receive_purchase_order_atomic", { p_po_id: input.po_id, p_lines: payloadLines });
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





/* ---------------- Employees ---------------- */

export type EmployeeRow = {
  id: UUID;
  org_id: UUID;
  name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  position: string | null;
  salary: number;
  status: string;
  hired_at: string;
  created_at: string;
};

export async function listEmployees(): Promise<EmployeeRow[]> {
  const { data, error } = await supabase.from("employees").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as EmployeeRow[];
}

export async function createEmployee(input: {
  name: string; email?: string; phone?: string;
  department?: string; position?: string; salary?: number;
}) {
  const { data, error } = await supabase.from("employees").insert({
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    department: input.department ?? null,
    position: input.position ?? null,
    salary: Number(input.salary ?? 0),
    status: "active",
  }).select("*").single();
  if (error) throw new Error(error.message);
  return data as EmployeeRow;
}

export async function deleteEmployee(id: UUID) {
  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------- Settings ---------------- */

export type SettingsRow = {
  id: UUID;
  company_name: string;
  company_email: string | null;
  timezone: string;
};

export async function getSettings(): Promise<SettingsRow | null> {
  const { data, error } = await supabase.from("settings").select("*").limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data as SettingsRow | null;
}

export async function saveSettings(input: { company_name: string; company_email?: string; timezone?: string }) {
  const existing = await getSettings();
  if (existing) {
    const { error } = await supabase.from("settings").update({
      company_name: input.company_name,
      company_email: input.company_email ?? null,
      timezone: input.timezone ?? "UTC",
      updated_at: new Date().toISOString(),
    }).eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("settings").insert({
      company_name: input.company_name,
      company_email: input.company_email ?? null,
      timezone: input.timezone ?? "UTC",
    });
    if (error) throw new Error(error.message);
  }
}

/* ---------------- User Roles ---------------- */

export type UserRole = "admin" | "manager" | "employee";

export async function getUserRole(user_id: UUID): Promise<UserRole> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user_id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.role ?? "employee") as UserRole;
}

/* ---------------- Payroll ---------------- */

export type PayrollRunRow = {
  id: UUID;
  org_id: UUID;
  period_label: string;
  period_start: string;
  period_end: string;
  status: string;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  created_at: string;
};

export type PayrollLineRow = {
  id: UUID;
  org_id: UUID;
  payroll_run_id: UUID;
  employee_id: UUID;
  employee_name: string;
  department: string | null;
  position: string | null;
  gross_salary: number;
  tax_deduction: number;
  other_deductions: number;
  net_salary: number;
  created_at: string;
};

export async function listPayrollRuns(): Promise<PayrollRunRow[]> {
  const { data, error } = await supabase.from("payroll_runs").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as PayrollRunRow[];
}

export async function listPayrollLines(payroll_run_id: UUID): Promise<PayrollLineRow[]> {
  const { data, error } = await supabase.from("payroll_lines").select("*").eq("payroll_run_id", payroll_run_id).order("employee_name");
  if (error) throw new Error(error.message);
  return (data ?? []) as PayrollLineRow[];
}

export async function createPayrollRun(input: {
  period_label: string;
  period_start: string;
  period_end: string;
  lines: Array<{
    employee_id: UUID;
    employee_name: string;
    department: string | null;
    position: string | null;
    gross_salary: number;
    tax_deduction: number;
    other_deductions: number;
    net_salary: number;
  }>;
}) {
  const total_gross = input.lines.reduce((s, l) => s + l.gross_salary, 0);
  const total_deductions = input.lines.reduce((s, l) => s + l.tax_deduction + l.other_deductions, 0);
  const total_net = input.lines.reduce((s, l) => s + l.net_salary, 0);

  const { data: run, error: runErr } = await supabase.from("payroll_runs").insert({
    period_label: input.period_label,
    period_start: input.period_start,
    period_end: input.period_end,
    status: "draft",
    total_gross,
    total_deductions,
    total_net,
  }).select("*").single();
  if (runErr) throw new Error(runErr.message);

  const lines = input.lines.map(l => ({ ...l, payroll_run_id: (run as any).id }));
  const { error: linesErr } = await supabase.from("payroll_lines").insert(lines);
  if (linesErr) throw new Error(linesErr.message);

  return run as PayrollRunRow;
}

export async function approvePayrollRun(id: UUID) {
  const { error } = await supabase.from("payroll_runs").update({ status: "approved" }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deletePayrollRun(id: UUID) {
  const { error } = await supabase.from("payroll_runs").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------- General Ledger ---------------- */

export type AccountRow = {
  id: UUID;
  code: string;
  name: string;
  type: string;
  subtype: string | null;
  balance: number;
  is_active: boolean;
  created_at: string;
};

export type JournalEntryRow = {
  id: UUID;
  entry_date: string;
  reference: string | null;
  description: string | null;
  status: string;
  created_at: string;
};

export type JournalLineRow = {
  id: UUID;
  journal_entry_id: UUID;
  account_id: UUID;
  account_code: string;
  account_name: string;
  description: string | null;
  debit: number;
  credit: number;
};

export async function listAccounts(): Promise<AccountRow[]> {
  const { data, error } = await supabase.from("accounts").select("*").eq("is_active", true).order("code");
  if (error) throw new Error(error.message);
  return (data ?? []) as AccountRow[];
}

export async function listJournalEntries(): Promise<JournalEntryRow[]> {
  const { data, error } = await supabase.from("journal_entries").select("*").order("entry_date", { ascending: false }).limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as JournalEntryRow[];
}

export async function listJournalLines(journal_entry_id: UUID): Promise<JournalLineRow[]> {
  const { data, error } = await supabase.from("journal_lines").select("*").eq("journal_entry_id", journal_entry_id);
  if (error) throw new Error(error.message);
  return (data ?? []) as JournalLineRow[];
}

export async function createJournalEntry(input: {
  entry_date: string;
  reference?: string;
  description?: string;
  lines: Array<{
    account_id: UUID;
    account_code: string;
    account_name: string;
    description?: string;
    debit: number;
    credit: number;
  }>;
}) {
  const totalDebit  = input.lines.reduce((s, l) => s + l.debit,  0);
  const totalCredit = input.lines.reduce((s, l) => s + l.credit, 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01)
    throw new Error(`Journal entry is not balanced. Debits: ${totalDebit}, Credits: ${totalCredit}`);

  const { data: entry, error: entryErr } = await supabase.from("journal_entries").insert({
    entry_date:  input.entry_date,
    reference:   input.reference   ?? null,
    description: input.description ?? null,
    status: "posted",
  }).select("*").single();
  if (entryErr) throw new Error(entryErr.message);

  const lines = input.lines.map(l => ({
    journal_entry_id: (entry as any).id,
    account_id:   l.account_id,
    account_code: l.account_code,
    account_name: l.account_name,
    description:  l.description ?? null,
    debit:  l.debit,
    credit: l.credit,
  }));
  const { error: linesErr } = await supabase.from("journal_lines").insert(lines);
  if (linesErr) throw new Error(linesErr.message);

  return entry as JournalEntryRow;
}

export async function voidJournalEntry(id: UUID) {
  const { error } = await supabase.from("journal_entries").update({ status: "void" }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getTrialBalance(): Promise<Array<{
  account_id: UUID; code: string; name: string; type: string;
  total_debit: number; total_credit: number; balance: number;
}>> {
  const { data: lines, error } = await supabase.from("journal_lines").select("account_id, account_code, account_name, debit, credit");
  if (error) throw new Error(error.message);

  const { data: accounts } = await supabase.from("accounts").select("id, code, name, type").eq("is_active", true).order("code");

  const map: Record<string, { total_debit: number; total_credit: number }> = {};
  for (const l of (lines ?? [])) {
    if (!map[l.account_id]) map[l.account_id] = { total_debit: 0, total_credit: 0 };
    map[l.account_id].total_debit  += Number(l.debit);
    map[l.account_id].total_credit += Number(l.credit);
  }

  return (accounts ?? []).map((a: any) => {
    const m = map[a.id] ?? { total_debit: 0, total_credit: 0 };
    const balance = m.total_debit - m.total_credit;
    return { account_id: a.id, code: a.code, name: a.name, type: a.type, ...m, balance };
  }).filter(r => r.total_debit !== 0 || r.total_credit !== 0);
}

/* ---------------- Financial Reports ---------------- */
export async function getFinancialReport(startDate: string, endDate: string) {
  const [salesLines, billLines, payrollRuns, payments] = await Promise.all([
    supabase.from("sales_order_lines").select("qty, price, created_at").gte("created_at", startDate).lte("created_at", endDate),
    supabase.from("bill_lines").select("qty, unit_cost, created_at").gte("created_at", startDate).lte("created_at", endDate),
    supabase.from("payroll_runs").select("total_net, period_start, period_end").gte("period_start", startDate).lte("period_end", endDate),
    supabase.from("invoice_payments").select("amount, paid_at").gte("paid_at", startDate).lte("paid_at", endDate),
  ]);
  const revenue = (salesLines.data ?? []).reduce((s: number, l: any) => s + Number(l.qty) * Number(l.price), 0);
  const cogs    = (billLines.data ?? []).reduce((s: number, l: any) => s + Number(l.qty) * Number(l.unit_cost), 0);
  const payroll = (payrollRuns.data ?? []).reduce((s: number, r: any) => s + Number(r.total_net), 0);
  const collected = (payments.data ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0);
  const grossProfit = revenue - cogs;
  const operatingExpenses = payroll;
  const netIncome = grossProfit - operatingExpenses;
  return { revenue, cogs, grossProfit, payroll, operatingExpenses, netIncome, collected };
}

/* ---------------- CRM ---------------- */
export type CRMLeadRow = {
  id: UUID; name: string; company: string | null; email: string | null;
  phone: string | null; stage: string; value: number; notes: string | null;
  owner_name: string | null; created_at: string;
};

export async function listLeads(): Promise<CRMLeadRow[]> {
  const { data, error } = await supabase.from("crm_leads").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CRMLeadRow[];
}

export async function createLead(input: { name: string; company?: string; email?: string; phone?: string; stage?: string; value?: number; notes?: string; owner_name?: string }) {
  const { data, error } = await supabase.from("crm_leads").insert({ name: input.name, company: input.company ?? null, email: input.email ?? null, phone: input.phone ?? null, stage: input.stage ?? "new", value: Number(input.value ?? 0), notes: input.notes ?? null, owner_name: input.owner_name ?? null }).select("*").single();
  if (error) throw new Error(error.message);
  return data as CRMLeadRow;
}

export async function updateLeadStage(id: UUID, stage: string) {
  const { error } = await supabase.from("crm_leads").update({ stage }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteLead(id: UUID) {
  const { error } = await supabase.from("crm_leads").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------- Manufacturing ---------------- */
export type WorkOrderRow = {
  id: UUID; reference: string; product_id: UUID | null; product_name: string;
  quantity: number; status: string; priority: string; scheduled_start: string | null;
  scheduled_end: string | null; actual_start: string | null; actual_end: string | null;
  notes: string | null; created_at: string;
};

export type BOMLineRow = {
  id: UUID; work_order_id: UUID; component_name: string; sku: string | null;
  quantity_required: number; unit: string; created_at: string;
};

export async function listWorkOrders(): Promise<WorkOrderRow[]> {
  const { data, error } = await supabase.from("work_orders").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as WorkOrderRow[];
}

export async function createWorkOrder(input: { reference: string; product_name: string; product_id?: UUID; quantity: number; priority?: string; scheduled_start?: string; scheduled_end?: string; notes?: string }) {
  const { data, error } = await supabase.from("work_orders").insert({ reference: input.reference, product_name: input.product_name, product_id: input.product_id ?? null, quantity: Number(input.quantity), status: "draft", priority: input.priority ?? "medium", scheduled_start: input.scheduled_start ?? null, scheduled_end: input.scheduled_end ?? null, notes: input.notes ?? null }).select("*").single();
  if (error) throw new Error(error.message);
  return data as WorkOrderRow;
}

export async function updateWorkOrderStatus(id: UUID, status: string) {
  const updates: any = { status };
  if (status === "in_progress") updates.actual_start = new Date().toISOString().slice(0, 10);
  if (status === "completed")   updates.actual_end   = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("work_orders").update(updates).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteWorkOrder(id: UUID) {
  const { error } = await supabase.from("work_orders").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listBOMLines(work_order_id: UUID): Promise<BOMLineRow[]> {
  const { data, error } = await supabase.from("bom_lines").select("*").eq("work_order_id", work_order_id);
  if (error) throw new Error(error.message);
  return (data ?? []) as BOMLineRow[];
}

export async function addBOMLine(input: { work_order_id: UUID; component_name: string; sku?: string; quantity_required: number; unit?: string }) {
  const { error } = await supabase.from("bom_lines").insert({ work_order_id: input.work_order_id, component_name: input.component_name, sku: input.sku ?? null, quantity_required: Number(input.quantity_required), unit: input.unit ?? "pcs" });
  if (error) throw new Error(error.message);
}

export async function deleteBOMLine(id: UUID) {
  const { error } = await supabase.from("bom_lines").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------- Projects ---------------- */
export type ProjectRow = {
  id: UUID; name: string; description: string | null; status: string; priority: string;
  start_date: string | null; due_date: string | null; budget: number; spent: number; created_at: string;
};

export type ProjectTaskRow = {
  id: UUID; project_id: UUID; title: string; description: string | null;
  status: string; priority: string; assignee_name: string | null; due_date: string | null; created_at: string;
};

export async function listProjects(): Promise<ProjectRow[]> {
  const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProjectRow[];
}

export async function createProject(input: { name: string; description?: string; priority?: string; start_date?: string; due_date?: string; budget?: number }) {
  const { data, error } = await supabase.from("projects").insert({ name: input.name, description: input.description ?? null, status: "active", priority: input.priority ?? "medium", start_date: input.start_date ?? null, due_date: input.due_date ?? null, budget: Number(input.budget ?? 0), spent: 0 }).select("*").single();
  if (error) throw new Error(error.message);
  return data as ProjectRow;
}

export async function updateProjectStatus(id: UUID, status: string) {
  const { error } = await supabase.from("projects").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteProject(id: UUID) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listProjectTasks(project_id: UUID): Promise<ProjectTaskRow[]> {
  const { data, error } = await supabase.from("project_tasks").select("*").eq("project_id", project_id).order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as ProjectTaskRow[];
}

export async function createProjectTask(input: { project_id: UUID; title: string; description?: string; priority?: string; assignee_name?: string; due_date?: string }) {
  const { error } = await supabase.from("project_tasks").insert({ project_id: input.project_id, title: input.title, description: input.description ?? null, status: "todo", priority: input.priority ?? "medium", assignee_name: input.assignee_name ?? null, due_date: input.due_date ?? null });
  if (error) throw new Error(error.message);
}

export async function updateTaskStatus(id: UUID, status: string) {
  const { error } = await supabase.from("project_tasks").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteTask(id: UUID) {
  const { error } = await supabase.from("project_tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------- Logistics / Shipments ---------------- */
export type ShipmentRow = {
  id: UUID; reference: string; type: string; status: string; carrier: string | null;
  tracking_number: string | null; origin: string | null; destination: string | null;
  ship_date: string | null; estimated_delivery: string | null; actual_delivery: string | null;
  sales_order_id: UUID | null; purchase_order_id: UUID | null; notes: string | null; created_at: string;
};

export async function listShipments(): Promise<ShipmentRow[]> {
  const { data, error } = await supabase.from("shipments").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ShipmentRow[];
}

export async function createShipment(input: { reference: string; type?: string; carrier?: string; tracking_number?: string; origin?: string; destination?: string; ship_date?: string; estimated_delivery?: string; notes?: string }) {
  const { data, error } = await supabase.from("shipments").insert({ reference: input.reference, type: input.type ?? "outbound", status: "pending", carrier: input.carrier ?? null, tracking_number: input.tracking_number ?? null, origin: input.origin ?? null, destination: input.destination ?? null, ship_date: input.ship_date ?? null, estimated_delivery: input.estimated_delivery ?? null, notes: input.notes ?? null }).select("*").single();
  if (error) throw new Error(error.message);
  return data as ShipmentRow;
}

export async function updateShipmentStatus(id: UUID, status: string) {
  const updates: any = { status };
  if (status === "delivered") updates.actual_delivery = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("shipments").update(updates).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteShipment(id: UUID) {
  const { error } = await supabase.from("shipments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------- Notifications ---------------- */
export type NotificationRow = {
  id: UUID; user_id: UUID | null; type: string; title: string; message: string;
  read: boolean; link: string | null; created_at: string;
};
export async function listNotifications(): Promise<NotificationRow[]> {
  const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as NotificationRow[];
}
export async function markNotificationRead(id: UUID) {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  if (error) throw new Error(error.message);
}
export async function markAllNotificationsRead() {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("read", false);
  if (error) throw new Error(error.message);
}
export async function createNotification(input: { type: string; title: string; message: string; link?: string; user_id?: UUID }) {
  const { error } = await supabase.from("notifications").insert({ type: input.type, title: input.title, message: input.message, link: input.link ?? null, user_id: input.user_id ?? null });
  if (error) throw new Error(error.message);
}
export async function deleteNotification(id: UUID) {
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
export async function generateSystemNotifications() {
  const [lowStock, overdueInvoices] = await Promise.all([
    supabase.from("products").select("id, name, stock").lte("stock", 5),
    supabase.from("invoices").select("id, customer_name, balance_due").lt("due_at", new Date().toISOString()).in("status", ["draft", "sent"]),
  ]);
  const inserts: any[] = [];
  for (const p of lowStock.data ?? []) {
    inserts.push({ type: "low_stock", title: "Low Stock Alert", message: `${p.name} has only ${p.stock} units left.`, link: "/inventory" });
  }
  for (const inv of overdueInvoices.data ?? []) {
    inserts.push({ type: "overdue_invoice", title: "Overdue Invoice", message: `Invoice for ${inv.customer_name} is overdue. Balance: $${Number(inv.balance_due).toFixed(2)}`, link: "/invoices" });
  }
  if (inserts.length > 0) {
    await supabase.from("notifications").insert(inserts);
  }
  return inserts.length;
}

/* ---------------- Record Notes ---------------- */
export type RecordNoteRow = {
  id: UUID; entity_type: string; entity_id: UUID; note: string;
  author_name: string | null; author_id: UUID | null; created_at: string;
};
export async function listNotes(entity_type: string, entity_id: UUID): Promise<RecordNoteRow[]> {
  const { data, error } = await supabase.from("record_notes").select("*").eq("entity_type", entity_type).eq("entity_id", entity_id).order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as RecordNoteRow[];
}
export async function addNote(input: { entity_type: string; entity_id: UUID; note: string; author_name?: string }) {
  const { error } = await supabase.from("record_notes").insert({ entity_type: input.entity_type, entity_id: input.entity_id, note: input.note, author_name: input.author_name ?? null });
  if (error) throw new Error(error.message);
}
export async function deleteNote(id: UUID) {
  const { error } = await supabase.from("record_notes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------- User Roles ---------------- */
export type UserRoleRow = { id: UUID; user_id: UUID; email: string; role: string; created_at: string; };
export async function listUserRoles(): Promise<UserRoleRow[]> {
  const { data, error } = await supabase.from("user_roles").select("*").order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as UserRoleRow[];
}
export async function upsertUserRole(input: { user_id: UUID; email: string; role: string }) {
  const { error } = await supabase.from("user_roles").upsert({ user_id: input.user_id, email: input.email, role: input.role }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}
export async function getCurrentUserRole(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "employee";
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).single();
  return data?.role ?? "employee";
}

/* ---------------- Calendar Events ---------------- */
export type CalendarEventRow = {
  id: UUID; title: string; description: string | null; type: string;
  start_date: string; end_date: string | null; all_day: boolean; color: string;
  entity_id: UUID | null; entity_type: string | null; created_at: string;
};
export async function listCalendarEvents(year: number, month: number): Promise<CalendarEventRow[]> {
  const start = `${year}-${String(month).padStart(2,"0")}-01`;
  const end   = new Date(year, month, 0).toISOString().slice(0,10);
  const { data, error } = await supabase.from("calendar_events").select("*").gte("start_date", start).lte("start_date", end).order("start_date");
  if (error) throw new Error(error.message);
  return (data ?? []) as CalendarEventRow[];
}
export async function createCalendarEvent(input: { title: string; description?: string; type?: string; start_date: string; end_date?: string; color?: string; entity_id?: UUID; entity_type?: string }) {
  const { error } = await supabase.from("calendar_events").insert({ title: input.title, description: input.description ?? null, type: input.type ?? "general", start_date: input.start_date, end_date: input.end_date ?? null, all_day: true, color: input.color ?? "#2563eb", entity_id: input.entity_id ?? null, entity_type: input.entity_type ?? null });
  if (error) throw new Error(error.message);
}
export async function deleteCalendarEvent(id: UUID) {
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------- Currency Rates ---------------- */
export type CurrencyRateRow = { id: UUID; from_currency: string; to_currency: string; rate: number; updated_at: string; };
export async function listCurrencyRates(): Promise<CurrencyRateRow[]> {
  const { data, error } = await supabase.from("currency_rates").select("*").order("from_currency");
  if (error) throw new Error(error.message);
  return (data ?? []) as CurrencyRateRow[];
}
export async function upsertCurrencyRate(from_currency: string, to_currency: string, rate: number) {
  const { error } = await supabase.from("currency_rates").upsert({ from_currency, to_currency, rate, updated_at: new Date().toISOString() }, { onConflict: "from_currency,to_currency" });
  if (error) throw new Error(error.message);
}
export function convertCurrency(amount: number, rates: CurrencyRateRow[], from: string, to: string): number {
  if (from === to) return amount;
  const rate = rates.find(r => r.from_currency === from && r.to_currency === to);
  return rate ? amount * Number(rate.rate) : amount;
}

/* ---------------- Email Templates ---------------- */
export type EmailTemplateRow = { id: UUID; name: string; subject: string; body: string; type: string; created_at: string; };
export async function listEmailTemplates(): Promise<EmailTemplateRow[]> {
  const { data, error } = await supabase.from("email_templates").select("*").order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as EmailTemplateRow[];
}
export async function saveEmailTemplate(input: { id?: UUID; name: string; subject: string; body: string; type: string }) {
  if (input.id) {
    const { error } = await supabase.from("email_templates").update({ name: input.name, subject: input.subject, body: input.body, type: input.type }).eq("id", input.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("email_templates").insert({ name: input.name, subject: input.subject, body: input.body, type: input.type });
    if (error) throw new Error(error.message);
  }
}
export async function deleteEmailTemplate(id: UUID) {
  const { error } = await supabase.from("email_templates").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
/* ---------------- Dashboard Charts ---------------- */
export async function getDashboardChartData() {
  const now = new Date();
  const months: { label: string; revenue: number; orders: number; expenses: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = d.toISOString().slice(0, 7) + "-01";
    const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
    const label = d.toLocaleString("default", { month: "short" });
    const [inv, ord, bills] = await Promise.all([
      supabase.from("invoices").select("total").gte("created_at", start).lte("created_at", end),
      supabase.from("sales_orders").select("id").gte("created_at", start).lte("created_at", end),
      supabase.from("bills").select("total").gte("created_at", start).lte("created_at", end),
    ]);
    const revenue  = (inv.data ?? []).reduce((s: number, r: any) => s + Number(r.total || 0), 0);
    const expenses = (bills.data ?? []).reduce((s: number, r: any) => s + Number(r.total || 0), 0);
    months.push({ label, revenue, orders: (ord.data ?? []).length, expenses });
  }
  return months;
}

export async function getStockChartData() {
  const { data } = await supabase.from("products").select("name,stock").order("stock", { ascending: false }).limit(10);
  return (data ?? []).map((r: any) => ({ name: r.name.length > 12 ? r.name.slice(0, 12) + "..." : r.name, stock: Number(r.stock || 0) }));
}
/* ─────────────────── MESSAGING ─────────────────── */
export type MessageChannelRow = {
  id: UUID; name: string; description?: string; type: "general"|"department"|"direct";
  created_at: string; member_count?: number; unread_count?: number;
};
export type MessageRow = {
  id: UUID; channel_id: UUID; sender_email: string; sender_name?: string;
  body: string; created_at: string; is_system?: boolean;
};

export async function listChannels(): Promise<MessageChannelRow[]> {
  const { data, error } = await supabase
    .from("message_channels")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}
export async function createChannel(input: { name: string; description?: string; type?: string }) {
  const { data, error } = await supabase
    .from("message_channels")
    .insert({ name: input.name, description: input.description, type: input.type ?? "general" })
    .select().single();
  if (error) throw new Error(error.message);
  return data;
}
export async function deleteChannel(id: UUID) {
  const { error } = await supabase.from("message_channels").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
export async function listMessages(channel_id: UUID, limit = 100): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("channel_id", channel_id)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}
export async function sendMessage(input: { channel_id: UUID; body: string; sender_email: string; sender_name?: string }) {
  const { data, error } = await supabase
    .from("messages")
    .insert({ channel_id: input.channel_id, body: input.body, sender_email: input.sender_email, sender_name: input.sender_name })
    .select().single();
  if (error) throw new Error(error.message);
  return data;
}
export async function deleteMessage(id: UUID) {
  const { error } = await supabase.from("messages").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
/* ─────────────────── AUTO CALENDAR SYNC ─────────────────── */
export async function syncCalendarFromERP() {
  const inserts: any[] = [];
  const [payrolls, projects, invoices] = await Promise.all([
    supabase.from("payroll_runs").select("id,period_end,status").eq("status","approved").limit(10),
    supabase.from("projects").select("id,name,due_date").not("due_date","is",null).limit(10),
    supabase.from("invoices").select("id,customer_name,due_at").not("due_at","is",null).in("status",["draft","sent"]).limit(10),
  ]);
  for (const p of payrolls.data ?? [])
    inserts.push({ title:"Nomina Aprobada", type:"payroll", start_date: p.period_end, color:"#16a34a", description: "Periodo: "+p.period_end });
  for (const p of projects.data ?? [])
    inserts.push({ title: p.name, type:"project", start_date: p.due_date.slice(0,10), color:"#7c3aed", description:"Vencimiento proyecto" });
  for (const inv of invoices.data ?? [])
    inserts.push({ title:"Vence: "+inv.customer_name, type:"invoice", start_date: inv.due_at.slice(0,10), color:"#dc2626", description:"Factura pendiente" });
  if (inserts.length > 0)
    await supabase.from("calendar_events").insert(inserts).select();
  return inserts.length;
}