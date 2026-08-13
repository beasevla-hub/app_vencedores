import autoTable from "jspdf-autotable";
import { jsPDF } from "jspdf";
import { calculateDiscount, type ReportData } from "@shared/reporting";

const LOGO_URL = "/manus-storage/thi-engenharia-positivo_4f57432d.png";
const BRAND_GREEN: [number, number, number] = [82, 166, 96];
const BRAND_DARK: [number, number, number] = [23, 76, 43];
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 12;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDateRange(startDate: string, endDate: string): string {
  const format = (date: string) => new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
  return `${format(startDate)} até ${format(endDate)}`;
}

async function imageDataUrl(url: string, opacity = 1): Promise<string> {
  const blob = await fetch(url).then(async response => {
    if (!response.ok) throw new Error("Não foi possível carregar o logotipo para o PDF.");
    return response.blob();
  });
  const sourceUrl = URL.createObjectURL(blob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Não foi possível processar o logotipo para o PDF."));
      element.src = sourceUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível preparar a marca d’água do PDF.");
    context.globalAlpha = opacity;
    context.drawImage(image, 0, 0);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

function drawWatermark(doc: jsPDF, watermark: string) {
  doc.addImage(watermark, "PNG", 47, 118, 116, 60);
}

function drawHeader(doc: jsPDF, report: ReportData, logo: string) {
  doc.setTextColor(...BRAND_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setCharSpace(1.3);
  doc.text("RELATÓRIO DE VENCEDORES", MARGIN, 13);
  doc.setCharSpace(0);
  doc.setFontSize(18);
  doc.text(report.filters.orgao.toUpperCase(), MARGIN, 22);

  doc.addImage(logo, "PNG", 168, 9, 30, 15.5);
  doc.setDrawColor(...BRAND_GREEN);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(143, 29, 55, 20, 1, 1, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(95, 107, 99);
  doc.text("PERÍODO", 147, 36);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(35, 48, 40);
  doc.text(formatDateRange(report.filters.startDate, report.filters.endDate), 147, 43);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(86, 96, 89);
  const subtitle = "Consolidado por empresa considerando registros com status aceita e habilitada ou perdida no período selecionado.";
  doc.text(doc.splitTextToSize(subtitle, 115), MARGIN, 32);
  doc.setDrawColor(210, 220, 212);
  doc.line(MARGIN, 53, PAGE_WIDTH - MARGIN, 53);
}

function drawSummaryCard(doc: jsPDF, x: number, title: string, main: string, detail?: string) {
  const cardWidth = 24.7;
  const cardHeight = 28;
  doc.setDrawColor(210, 230, 214);
  doc.setFillColor(241, 248, 242);
  doc.rect(x, 57, cardWidth, cardHeight, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.8);
  doc.setTextColor(84, 111, 90);
  doc.setCharSpace(0.5);
  doc.text(doc.splitTextToSize(title.toUpperCase(), cardWidth - 4), x + 2, 65);
  doc.setCharSpace(0);
  doc.setTextColor(33, 52, 39);
  doc.setFontSize(detail ? 5.6 : 8);
  const mainLines = doc.splitTextToSize(main, cardWidth - 4);
  doc.text(mainLines.slice(0, detail ? 3 : 2), x + 2, detail ? 73 : 75);
  if (detail) {
    doc.setFontSize(7.4);
    doc.text(detail, x + 2, 83);
  }
}

function drawSummary(doc: jsPDF, report: ReportData) {
  const cards = [
    ["Empresas", String(report.summary.totalEmpresas)],
    ["Licitações", String(report.summary.totalLicitacoes)],
    ["Empresa c/ maior valor aceito", report.summary.empresaMaiorValorAceito ?? "—", formatCurrency(report.summary.totalMaiorEmpresa)],
    ["Maior contrato", formatCurrency(report.summary.maiorContrato)],
    ["Valor publicado", formatCurrency(report.summary.valorPublicado)],
    ["Valor contratado", formatCurrency(report.summary.valorContratado)],
    ["Saldo", formatCurrency(report.summary.saldo)],
  ] as const;

  cards.forEach(([title, main, detail], index) => {
    drawSummaryCard(doc, MARGIN + index * 26.3, title, main, detail);
  });
}

function drawFooter(doc: jsPDF, report: ReportData, page: number, totalPages: number) {
  doc.setDrawColor(218, 224, 219);
  doc.line(MARGIN, 284, PAGE_WIDTH - MARGIN, 284);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 109, 103);
  doc.setCharSpace(0.4);
  doc.text(
    `${report.summary.totalEmpresas} EMPRESAS   ${report.summary.totalLicitacoes} LICITAÇÕES   ${formatCurrency(report.summary.valorContratado)}`,
    MARGIN,
    290,
  );
  doc.setCharSpace(0);
  doc.text(`PÁGINA ${page}/${totalPages}`, PAGE_WIDTH - MARGIN, 290, { align: "right" });
}

export async function downloadReportPdf(report: ReportData): Promise<void> {
  const [logo, watermark] = await Promise.all([imageDataUrl(LOGO_URL), imageDataUrl(LOGO_URL, 0.075)]);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });

  drawWatermark(doc, watermark);
  drawHeader(doc, report, logo);
  drawSummary(doc, report);
  let cursorY = 91;

  for (const group of report.groups) {
    if (cursorY > 252) {
      doc.addPage();
      drawWatermark(doc, watermark);
      cursorY = 16;
    }

    doc.setDrawColor(...BRAND_GREEN);
    doc.setFillColor(250, 252, 250);
    doc.rect(MARGIN, cursorY, PAGE_WIDTH - MARGIN * 2, 11, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(35, 52, 40);
    doc.text(group.empresa.toUpperCase(), MARGIN + 2, cursorY + 4.6, { maxWidth: 130 });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    doc.setTextColor(105, 114, 108);
    doc.text(`${group.licitacoes.length} licitação(ões)`, MARGIN + 2, cursorY + 8.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(32, 47, 37);
    doc.text(formatCurrency(group.totalAceito), PAGE_WIDTH - MARGIN - 2, cursorY + 7, { align: "right" });

    autoTable(doc, {
      startY: cursorY + 11,
      margin: { left: MARGIN, right: MARGIN },
      tableWidth: PAGE_WIDTH - MARGIN * 2,
      theme: "grid",
      head: [["LICITAÇÃO", "VALOR EDITAL", "VALOR ACEITO", "DESCONTO -%"]],
      body: group.licitacoes.map(licitacao => [
        [
          `${licitacao.edital || "Edital não informado"}${licitacao.processo ? `  Processo: ${licitacao.processo}` : ""}`,
          licitacao.objeto || "Objeto não informado.",
        ].join("\n"),
        licitacao.valorPublicado === null ? "—" : formatCurrency(licitacao.valorPublicado),
        licitacao.valorAceito === null ? "—" : formatCurrency(licitacao.valorAceito),
        (() => {
          const discount = calculateDiscount(licitacao.valorPublicado, licitacao.valorAceito);
          return discount === null ? "—" : `${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(discount)}%`;
        })(),
      ]),
      styles: {
        font: "helvetica",
        fontSize: 6.7,
        cellPadding: 1.6,
        lineColor: BRAND_GREEN,
        lineWidth: 0.16,
        textColor: [34, 44, 37],
        overflow: "linebreak",
        valign: "top",
      },
      headStyles: { fillColor: [255, 255, 255], textColor: [32, 43, 35], fontStyle: "bold", fontSize: 6.2 },
      columnStyles: {
        0: { cellWidth: 108 },
        1: { cellWidth: 25.5, halign: "right" },
        2: { cellWidth: 25.5, halign: "right" },
        3: { cellWidth: 15, halign: "right", fontStyle: "bold" },
      },
      didDrawPage: data => {
        if (data.pageNumber > 1) drawWatermark(doc, watermark);
      },
    });

    cursorY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? cursorY + 40;
    cursorY += 4;
  }

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    drawFooter(doc, report, page, pages);
  }

  const filename = `relatorio-vencedores-${report.filters.orgao.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-${report.filters.startDate}-${report.filters.endDate}.pdf`;
  doc.save(filename);
}
