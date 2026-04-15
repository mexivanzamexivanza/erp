import PptxGenJS from "pptxgenjs";
import { saveAs } from "file-saver";

export async function exportPowerPoint(title: string, bullets: string[]): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "ERP System";
  pptx.subject = "Reporte ERP";
  pptx.title = title;

  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: "F8FAFC" };
  titleSlide.addText(title, { x: 0.8, y: 1.6, w: 11.5, h: 1, bold: true, fontSize: 34, color: "1F2937" });
  titleSlide.addText(`Generado: ${new Date().toLocaleString("es-MX")}`, { x: 0.8, y: 2.7, w: 11.5, h: 0.5, fontSize: 14, color: "6B7280" });

  const dataSlide = pptx.addSlide();
  dataSlide.background = { color: "FFFFFF" };
  dataSlide.addText("Resumen de datos", { x: 0.8, y: 0.5, w: 11.5, h: 0.5, bold: true, fontSize: 24, color: "111827" });
  dataSlide.addText(
    (bullets.length > 0 ? bullets : ["Sin datos para mostrar"]).map((bullet) => ({ text: bullet, options: { bullet: { indent: 14 } } })),
    { x: 1.0, y: 1.3, w: 11.0, h: 4.8, fontSize: 18, color: "374151" },
  );

  const blob = await pptx.write({ outputType: "blob" });
  const safeTitle = title.toLowerCase().replace(/\s+/g, "_").replace(/[^\w-]/g, "");
  saveAs(blob, `${safeTitle || "presentacion"}_${Date.now()}.pptx`);
}
