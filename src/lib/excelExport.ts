import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function exportExcel(sheetName: string, data: Record<string, any>[], filename: string): void {
  const worksheet = XLSX.utils.json_to_sheet(data.length > 0 ? data : [{ Mensaje: "No hay datos para exportar" }]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const safeFilename = filename.toLowerCase().replace(/\s+/g, "_").replace(/[^\w.-]/g, "");
  saveAs(blob, safeFilename.endsWith(".xlsx") ? safeFilename : `${safeFilename || "reporte"}.xlsx`);
}
