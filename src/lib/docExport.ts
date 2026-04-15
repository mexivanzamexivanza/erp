import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { saveAs } from "file-saver";

export async function exportWordReport(title: string, rows: Record<string, string | number>[]): Promise<void> {
  const keys = rows.length > 0 ? Object.keys(rows[0]) : [];
  const tableRows: TableRow[] = [];

  if (keys.length > 0) {
    tableRows.push(
      new TableRow({
        children: keys.map((key) => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: key, bold: true })] })],
        })),
      }),
    );

    rows.forEach((row) => {
      tableRows.push(
        new TableRow({
          children: keys.map((key) => new TableCell({
            children: [new Paragraph(String(row[key] ?? ""))],
          })),
        }),
      );
    });
  }

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
        new Paragraph(`Fecha de generación: ${new Date().toLocaleString("es-MX")}`),
        new Paragraph(""),
        ...(tableRows.length > 0
          ? [new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } })]
          : [new Paragraph("No hay datos para exportar.")]),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const safeName = title.toLowerCase().replace(/\s+/g, "_").replace(/[^\w-]/g, "");
  saveAs(blob, `${safeName || "reporte"}_${Date.now()}.docx`);
}

export async function exportWordContract(customerName: string, amount: number, date: string): Promise<void> {
  const contractDate = date || new Date().toISOString().slice(0, 10);
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: "Contrato de Servicios", heading: HeadingLevel.HEADING_1 }),
        new Paragraph(`Fecha: ${contractDate}`),
        new Paragraph(""),
        new Paragraph(`Cliente: ${customerName}`),
        new Paragraph(`Monto acordado: $${Number(amount || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`),
        new Paragraph(""),
        new Paragraph("Ambas partes acuerdan la prestación de servicios conforme a los términos comerciales establecidos."),
        new Paragraph(""),
        new Paragraph("Firma del Cliente: __________________________"),
        new Paragraph("Firma de la Empresa: ________________________"),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const safeCustomer = (customerName || "cliente").toLowerCase().replace(/\s+/g, "_").replace(/[^\w-]/g, "");
  saveAs(blob, `contrato_${safeCustomer}_${Date.now()}.docx`);
}
