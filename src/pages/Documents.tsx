import { useEffect, useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabaseClient";
import { exportWordContract, exportWordReport } from "../lib/docExport";
import { exportExcel } from "../lib/excelExport";
import { exportPowerPoint } from "../lib/pptExport";

type TabKey = "word" | "excel" | "powerpoint" | "files";
type StorageFile = { name: string; created_at?: string; updated_at?: string; metadata?: { size?: number } };

export default function Documents() {
  const [tab, setTab] = useState<TabKey>("word");
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [customerName, setCustomerName] = useState("");
  const [amount, setAmount] = useState("");
  const [contractDate, setContractDate] = useState(new Date().toISOString().slice(0, 10));
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const tabStyle = (value: TabKey): CSSProperties => ({
    padding: "8px 20px",
    borderRadius: 999,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    border: "1px solid " + (tab === value ? "var(--primary)" : "var(--border)"),
    background: tab === value ? "var(--primary)" : "white",
    color: tab === value ? "white" : "var(--text)",
  });

  function setBusy(key: string, value: boolean) {
    setLoading((prev) => ({ ...prev, [key]: value }));
  }

  function toCurrency(value: number) {
    return value.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  }

  function toDate(value?: string) {
    if (!value) return "-";
    return new Date(value).toLocaleString("es-MX");
  }

  function fileIcon(filename: string) {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "docx" || ext === "doc") return "📝";
    if (ext === "xlsx" || ext === "xls" || ext === "csv") return "📊";
    if (ext === "pptx" || ext === "ppt") return "📽️";
    if (ext === "pdf") return "📕";
    if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "gif") return "🖼️";
    if (ext === "zip" || ext === "rar") return "🗜️";
    return "📁";
  }

  function fileSizeLabel(size?: number) {
    if (!size || size < 1) return "-";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function loadFiles() {
    setFilesLoading(true);
    const { data, error } = await supabase.storage
      .from("documents")
      .list("documents", { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    if (error) alert(error.message);
    setFiles((data ?? []) as StorageFile[]);
    setFilesLoading(false);
  }

  useEffect(() => {
    if (tab === "files") loadFiles();
  }, [tab]);

  async function exportInvoiceWordReport() {
    setBusy("wordInvoices", true);
    const { data, error } = await supabase
      .from("invoices")
      .select("invoice_number,customer_name,total,status,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) alert(error.message);
    else await exportWordReport("Reporte de Facturas", (data ?? []) as Record<string, string | number>[]);
    setBusy("wordInvoices", false);
  }

  async function exportEmployeesWordReport() {
    setBusy("wordEmployees", true);
    const { data, error } = await supabase
      .from("employees")
      .select("name,position,department,salary")
      .limit(50);
    if (error) alert(error.message);
    else await exportWordReport("Reporte de Empleados", (data ?? []) as Record<string, string | number>[]);
    setBusy("wordEmployees", false);
  }

  async function exportContract() {
    if (!customerName.trim()) return alert("Ingresa el nombre del cliente.");
    if (!amount || Number(amount) <= 0) return alert("Ingresa un monto válido.");
    setBusy("wordContract", true);
    await exportWordContract(customerName.trim(), Number(amount), contractDate);
    setBusy("wordContract", false);
  }

  async function exportInventoryExcel() {
    setBusy("excelInventory", true);
    const { data, error } = await supabase.from("products").select("name,sku,stock,price,category").limit(200);
    if (error) alert(error.message);
    else exportExcel("Inventario", (data ?? []) as Record<string, any>[], "inventario.xlsx");
    setBusy("excelInventory", false);
  }

  async function exportInvoicesExcel() {
    setBusy("excelInvoices", true);
    const { data, error } = await supabase.from("invoices").select("invoice_number,customer_name,total,status,created_at").limit(200);
    if (error) alert(error.message);
    else exportExcel("Facturas", (data ?? []) as Record<string, any>[], "facturas.xlsx");
    setBusy("excelInvoices", false);
  }

  async function exportEmployeesExcel() {
    setBusy("excelEmployees", true);
    const { data, error } = await supabase.from("employees").select("name,position,department,salary").limit(200);
    if (error) alert(error.message);
    else exportExcel("Empleados", (data ?? []) as Record<string, any>[], "empleados_nomina.xlsx");
    setBusy("excelEmployees", false);
  }

  async function exportSalesOrdersExcel() {
    setBusy("excelSalesOrders", true);
    const { data, error } = await supabase.from("sales_orders").select("order_number,customer_name,total,status,created_at").limit(200);
    if (error) alert(error.message);
    else exportExcel("Ordenes de Venta", (data ?? []) as Record<string, any>[], "ordenes_venta.xlsx");
    setBusy("excelSalesOrders", false);
  }

  async function exportExecutivePowerPoint() {
    setBusy("pptExecutive", true);
    const { data, error } = await supabase.from("invoices").select("total,status,created_at").limit(300);
    if (error) alert(error.message);
    else {
      const invoices = (data ?? []) as { total: number; status?: string }[];
      const totalBilled = invoices.reduce((sum, item) => sum + Number(item.total || 0), 0);
      const pending = invoices.filter((item) => (item.status ?? "").toLowerCase().includes("pend")).length;
      const paid = invoices.filter((item) => (item.status ?? "").toLowerCase().includes("paid") || (item.status ?? "").toLowerCase().includes("pag")).length;
      await exportPowerPoint("Resumen Ejecutivo", [
        `Total facturado: ${toCurrency(totalBilled)}`,
        `Facturas registradas: ${invoices.length}`,
        `Facturas pendientes: ${pending}`,
        `Facturas pagadas: ${paid}`,
      ]);
    }
    setBusy("pptExecutive", false);
  }

  async function exportSalesPowerPoint() {
    setBusy("pptSales", true);
    const { data, error } = await supabase.from("sales_orders").select("total,status,created_at").limit(300);
    if (error) alert(error.message);
    else {
      const orders = (data ?? []) as { total: number; status?: string }[];
      const totalSales = orders.reduce((sum, item) => sum + Number(item.total || 0), 0);
      const avg = orders.length > 0 ? totalSales / orders.length : 0;
      const closed = orders.filter((item) => {
        const status = (item.status ?? "").toLowerCase();
        return status.includes("complete") || status.includes("cerr");
      }).length;
      await exportPowerPoint("Reporte de Ventas", [
        `Órdenes analizadas: ${orders.length}`,
        `Total de ventas: ${toCurrency(totalSales)}`,
        `Ticket promedio: ${toCurrency(avg)}`,
        `Órdenes cerradas: ${closed}`,
      ]);
    }
    setBusy("pptSales", false);
  }

  async function exportHrPowerPoint() {
    setBusy("pptHr", true);
    const { data, error } = await supabase.from("employees").select("department,salary").limit(500);
    if (error) alert(error.message);
    else {
      const employees = (data ?? []) as { department?: string; salary?: number }[];
      const byDepartment = employees.reduce<Record<string, number>>((acc, employee) => {
        const key = employee.department?.trim() || "Sin departamento";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {});
      const departmentBullets = Object.entries(byDepartment).map(([department, count]) => `${department}: ${count} empleados`);
      const avgSalary = employees.length > 0 ? employees.reduce((sum, item) => sum + Number(item.salary || 0), 0) / employees.length : 0;
      await exportPowerPoint("Resumen de RRHH", [
        `Empleados totales: ${employees.length}`,
        `Salario promedio: ${toCurrency(avgSalary)}`,
        ...departmentBullets,
      ]);
    }
    setBusy("pptHr", false);
  }

  async function uploadFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    const path = `documents/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: false });
    if (error) alert(error.message);
    await loadFiles();
    setUploading(false);
  }

  async function downloadFile(file: StorageFile) {
    const path = `documents/${file.name}`;
    const { data: signedData, error: signedError } = await supabase.storage.from("documents").createSignedUrl(path, 60);
    if (signedError || !signedData?.signedUrl) {
      const { data: publicData } = supabase.storage.from("documents").getPublicUrl(path);
      if (!publicData?.publicUrl) return alert("No se pudo generar el enlace de descarga.");
      window.open(publicData.publicUrl, "_blank");
      return;
    }
    window.open(signedData.signedUrl, "_blank");
  }

  async function deleteFile(file: StorageFile) {
    if (!confirm(`¿Eliminar "${file.name}"?`)) return;
    const { error } = await supabase.storage.from("documents").remove([`documents/${file.name}`]);
    if (error) alert(error.message);
    await loadFiles();
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 className="pageTitle">📄 Documentos</h1>
        <div className="pageSub">Genera y exporta documentos de Word, Excel y PowerPoint desde tus datos del ERP.</div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button style={tabStyle("word")} onClick={() => setTab("word")}>📝 Word</button>
        <button style={tabStyle("excel")} onClick={() => setTab("excel")}>📊 Excel</button>
        <button style={tabStyle("powerpoint")} onClick={() => setTab("powerpoint")}>📊 PowerPoint</button>
        <button style={tabStyle("files")} onClick={() => setTab("files")}>📁 Archivos</button>
      </div>

      {tab === "word" && (
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 30 }}>🧾</div>
            <div style={{ fontWeight: 700, marginTop: 8 }}>Reporte de Facturas</div>
            <div style={{ color: "var(--muted)", fontSize: 13, margin: "6px 0 14px" }}>Exporta las últimas 50 facturas en formato Word.</div>
            <button className="btn btnPrimary" disabled={!!loading.wordInvoices} onClick={exportInvoiceWordReport}>
              {loading.wordInvoices ? "Exportando..." : "Exportar .docx"}
            </button>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 30 }}>👥</div>
            <div style={{ fontWeight: 700, marginTop: 8 }}>Reporte de Empleados</div>
            <div style={{ color: "var(--muted)", fontSize: 13, margin: "6px 0 14px" }}>Genera un documento con datos clave del personal.</div>
            <button className="btn btnPrimary" disabled={!!loading.wordEmployees} onClick={exportEmployeesWordReport}>
              {loading.wordEmployees ? "Exportando..." : "Exportar .docx"}
            </button>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 30 }}>📄</div>
            <div style={{ fontWeight: 700, marginTop: 8 }}>Contrato de Cliente</div>
            <div style={{ color: "var(--muted)", fontSize: 13, margin: "6px 0 14px" }}>Completa los datos para generar un contrato base.</div>
            <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
              <input className="input" placeholder="Nombre del cliente" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              <input className="input" type="number" placeholder="Monto (MXN)" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <input className="input" type="date" value={contractDate} onChange={(e) => setContractDate(e.target.value)} />
            </div>
            <button className="btn btnPrimary" disabled={!!loading.wordContract} onClick={exportContract}>
              {loading.wordContract ? "Exportando..." : "Exportar .docx"}
            </button>
          </div>
        </div>
      )}

      {tab === "excel" && (
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 28 }}>📦</div>
            <div style={{ fontWeight: 700, marginTop: 8 }}>Inventario</div>
            <div style={{ color: "var(--muted)", fontSize: 13, margin: "6px 0 14px" }}>Exporta productos, SKU, stock y precio.</div>
            <button className="btn btnPrimary" disabled={!!loading.excelInventory} onClick={exportInventoryExcel}>
              {loading.excelInventory ? "Exportando..." : "Exportar .xlsx"}
            </button>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 28 }}>🧾</div>
            <div style={{ fontWeight: 700, marginTop: 8 }}>Facturas</div>
            <div style={{ color: "var(--muted)", fontSize: 13, margin: "6px 0 14px" }}>Descarga hasta 200 facturas para análisis externo.</div>
            <button className="btn btnPrimary" disabled={!!loading.excelInvoices} onClick={exportInvoicesExcel}>
              {loading.excelInvoices ? "Exportando..." : "Exportar .xlsx"}
            </button>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 28 }}>💼</div>
            <div style={{ fontWeight: 700, marginTop: 8 }}>Empleados & Nómina</div>
            <div style={{ color: "var(--muted)", fontSize: 13, margin: "6px 0 14px" }}>Genera un archivo para revisar sueldos y áreas.</div>
            <button className="btn btnPrimary" disabled={!!loading.excelEmployees} onClick={exportEmployeesExcel}>
              {loading.excelEmployees ? "Exportando..." : "Exportar .xlsx"}
            </button>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 28 }}>🛒</div>
            <div style={{ fontWeight: 700, marginTop: 8 }}>Órdenes de Venta</div>
            <div style={{ color: "var(--muted)", fontSize: 13, margin: "6px 0 14px" }}>Exporta órdenes de venta y su estatus.</div>
            <button className="btn btnPrimary" disabled={!!loading.excelSalesOrders} onClick={exportSalesOrdersExcel}>
              {loading.excelSalesOrders ? "Exportando..." : "Exportar .xlsx"}
            </button>
          </div>
        </div>
      )}

      {tab === "powerpoint" && (
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 28 }}>📈</div>
            <div style={{ fontWeight: 700, marginTop: 8 }}>Resumen Ejecutivo</div>
            <div style={{ color: "var(--muted)", fontSize: 13, margin: "6px 0 14px" }}>Genera una presentación con indicadores de facturación.</div>
            <button className="btn btnPrimary" disabled={!!loading.pptExecutive} onClick={exportExecutivePowerPoint}>
              {loading.pptExecutive ? "Exportando..." : "Exportar .pptx"}
            </button>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 28 }}>📊</div>
            <div style={{ fontWeight: 700, marginTop: 8 }}>Reporte de Ventas</div>
            <div style={{ color: "var(--muted)", fontSize: 13, margin: "6px 0 14px" }}>Resume desempeño comercial y ticket promedio.</div>
            <button className="btn btnPrimary" disabled={!!loading.pptSales} onClick={exportSalesPowerPoint}>
              {loading.pptSales ? "Exportando..." : "Exportar .pptx"}
            </button>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 28 }}>👥</div>
            <div style={{ fontWeight: 700, marginTop: 8 }}>Resumen de RRHH</div>
            <div style={{ color: "var(--muted)", fontSize: 13, margin: "6px 0 14px" }}>Muestra conteo por departamento y salario promedio.</div>
            <button className="btn btnPrimary" disabled={!!loading.pptHr} onClick={exportHrPowerPoint}>
              {loading.pptHr ? "Exportando..." : "Exportar .pptx"}
            </button>
          </div>
        </div>
      )}

      {tab === "files" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Subir archivo</div>
            <input
              type="file"
              onChange={(e) => { void uploadFile(e.target.files?.[0] ?? null); e.currentTarget.value = ""; }}
              disabled={uploading}
            />
            {uploading && <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 13 }}>Subiendo archivo...</div>}
          </div>

          <div className="card">
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>📁 Archivos cargados</div>
            {filesLoading ? (
              <div style={{ padding: 20, color: "var(--muted)" }}>Cargando archivos...</div>
            ) : files.length === 0 ? (
              <div style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>No hay archivos en el bucket "documents".</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Archivo</th>
                    <th>Tamaño</th>
                    <th>Fecha</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr key={file.name}>
                      <td style={{ fontWeight: 600 }}>{fileIcon(file.name)} {file.name}</td>
                      <td style={{ color: "var(--muted)" }}>{fileSizeLabel(file.metadata?.size)}</td>
                      <td style={{ color: "var(--muted)" }}>{toDate(file.created_at ?? file.updated_at)}</td>
                      <td style={{ display: "flex", gap: 8 }}>
                        <button className="btn" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => void downloadFile(file)}>Descargar</button>
                        <button className="btn btnDanger" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => void deleteFile(file)}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
