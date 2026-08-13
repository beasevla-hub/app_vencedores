import autoTable from "jspdf-autotable";
import { jsPDF } from "jspdf";
import { calculateDiscount, type CompanyGroup, type ReportData } from "@shared/reporting";

const LOGO_URL = "/manus-storage/thi-engenharia-arquitetura-oficial_8e77bf2b.png";
const BRAND_GREEN: [number, number, number] = [82, 166, 96];
const BRAND_DARK: [number, number, number] = [23, 76, 43];
const SOFT_GREEN: [number, number, number] = [241, 248, 242];
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 10;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_Y = 284;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDateRange(startDate: string, endDate: string): string {
  const format = (date: string) => new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
  return `${format(startDate)} até ${format(endDate)}`;
}

function formatDiscount(published: number | null, accepted: number | null): string {
  const discount = calculateDiscount(published, accepted);
  return discount === null ? "—" : `${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(discount)}%`;
}

async function imageDataUrl(url: string, opacity = 1): Promise<string> {
  const blob = await fetch(url).then(async response => {
    if (!response.ok) throw new Error("Não foi possível carregar o logotipo oficial para o PDF.");
    return response.blob();
  });
  const sourceUrl = URL.createObjectURL(blob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Não foi possível processar o logotipo oficial para o PDF."));
      element.src = sourceUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível preparar o logotipo para o PDF.");
    context.globalAlpha = opacity;
    context.drawImage(image, 0, 0);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

function drawWatermark(doc: jsPDF, watermark: string) {
  doc.addImage(watermark, "PNG", 53, 130, 104, 53);
}

function drawHeader(doc: jsPDF, report: ReportData, logo: string) {
  doc.addImage(logo, "PNG", MARGIN, 10, 18, 9.3);
  doc.setTextColor(80, 90, 84);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.8);
  doc.setCharSpace(0.85);
  doc.text("RELATÓRIO DE VENCEDORES", 31, 12.5);
  doc.setCharSpace(0);
  doc.setTextColor(25, 38, 30);
  doc.setFontSize(15.5);
  doc.text(report.filters.orgao.toUpperCase(), 31, 21.5);

  doc.setDrawColor(183, 215, 190);
  doc.setLineWidth(0.3);
  doc.rect(142, 10, 58, 19.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  doc.setTextColor(96, 108, 100);
  doc.text("PERÍODO", 146, 16.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.setTextColor(30, 42, 34);
  doc.text(formatDateRange(report.filters.startDate, report.filters.endDate), 146, 23.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.9);
  doc.setTextColor(91, 101, 95);
  const subtitle = "Consolidado por empresa considerando registros com status perdida ou aceita e habilitada no período selecionado.";
  doc.text(doc.splitTextToSize(subtitle, 115), MARGIN, 35.2);
  doc.setDrawColor(216, 223, 217);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, 46.5, PAGE_WIDTH - MARGIN, 46.5);
}

type SummaryCard = { label: string; value: string; detail?: string; width: number };

function drawSummaryCard(doc: jsPDF, x: number, card: SummaryCard) {
  const y = 50;
  const height = 28;
  doc.setDrawColor(211, 232, 215);
  doc.setFillColor(...SOFT_GREEN);
  doc.rect(x, y, card.width, height, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.2);
  doc.setCharSpace(0.35);
  doc.setTextColor(90, 114, 94);
  doc.text(doc.splitTextToSize(card.label.toUpperCase(), card.width - 3), x + 1.5, y + 7);
  doc.setCharSpace(0);
  doc.setTextColor(27, 43, 33);

  if (card.detail) {
    doc.setFontSize(5.3);
    const companyLines = doc.splitTextToSize(card.value, card.width - 3).slice(0, 3);
    doc.text(companyLines, x + 1.5, y + 14);
    doc.setFontSize(5.3);
    doc.text(card.detail.replace(/^R\$\s*/, "R$ "), x + 1.5, y + 25);
    return;
  }

  const money = card.value.match(/^R\$\s*(.+)$/);
  if (money) {
    doc.setFontSize(5.4);
    doc.text("R$", x + 1.5, y + 19);
    doc.setFontSize(6.3);
    doc.text(money[1], x + 1.5, y + 24);
    return;
  }

  doc.setFontSize(8.1);
  doc.text(card.value, x + 1.5, y + 20.5);
}

function drawSummary(doc: jsPDF, report: ReportData) {
  const cards: SummaryCard[] = [
    { label: "Empresas", value: String(report.summary.totalEmpresas), width: 18.5 },
    { label: "Licitações", value: String(report.summary.totalLicitacoes), width: 19.5 },
    { label: "Empresa c/ maior valor aceito", value: report.summary.empresaMaiorValorAceito ?? "—", detail: formatCurrency(report.summary.totalMaiorEmpresa), width: 29.5 },
    { label: "Maior contrato", value: formatCurrency(report.summary.maiorContrato), width: 27.5 },
    { label: "Valor publicado", value: formatCurrency(report.summary.valorPublicado), width: 28 },
    { label: "Valor contratado", value: formatCurrency(report.summary.valorContratado), width: 28 },
    { label: "Saldo", value: formatCurrency(report.summary.saldo), width: 27 },
  ];
  let x = MARGIN;
  cards.forEach(card => {
    drawSummaryCard(doc, x, card);
    x += card.width + 1.2;
  });
}

function groupHeaderHeight(doc: jsPDF, group: CompanyGroup): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.3);
  return doc.splitTextToSize(group.empresa.toUpperCase(), 132).length > 1 ? 13 : 10;
}

function estimatedGroupHeight(doc: jsPDF, group: CompanyGroup): number {
  const header = groupHeaderHeight(doc, group);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  const rows = group.licitacoes.reduce((sum, licitacao) => {
    const content = `${licitacao.edital || "Edital não informado"}  ${licitacao.processo ? `Processo: ${licitacao.processo}` : ""}\n${licitacao.objeto || "Objeto não informado."}`;
    const lines = doc.splitTextToSize(content, 108).length;
    return sum + Math.max(9, lines * 2.35 + 4.4);
  }, 0);
  return header + 5.5 + rows + 4;
}

function drawCompanyGroup(doc: jsPDF, group: CompanyGroup, y: number): number {
  const headerHeight = groupHeaderHeight(doc, group);
  doc.setDrawColor(...BRAND_GREEN);
  doc.setFillColor(252, 253, 252);
  doc.rect(MARGIN, y, CONTENT_WIDTH, headerHeight, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.3);
  doc.setTextColor(32, 43, 35);
  doc.text(doc.splitTextToSize(group.empresa.toUpperCase(), 132), MARGIN + 2, y + 4.2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  doc.setTextColor(111, 121, 114);
  doc.text(`${group.licitacoes.length} licitação(ões)`, MARGIN + 2, y + headerHeight - 2.1);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.setTextColor(35, 48, 39);
  doc.text(formatCurrency(group.totalAceito), PAGE_WIDTH - MARGIN - 2, y + headerHeight - 3.4, { align: "right" });

  autoTable(doc, {
    startY: y + headerHeight,
    margin: { left: MARGIN, right: MARGIN, top: 10, bottom: 16 },
    tableWidth: CONTENT_WIDTH,
    theme: "grid",
    rowPageBreak: "avoid",
    head: [["LICITAÇÃO", "VALOR EDITAL", "VALOR ACEITO", "DESCONTO -%"]],
    body: group.licitacoes.map(licitacao => [
      [`${licitacao.edital || "Edital não informado"}${licitacao.processo ? `   Processo: ${licitacao.processo}` : ""}\n${licitacao.objeto || "Objeto não informado."}`],
      [licitacao.valorPublicado === null ? "—" : formatCurrency(licitacao.valorPublicado)],
      [licitacao.valorAceito === null ? "—" : formatCurrency(licitacao.valorAceito)],
      [formatDiscount(licitacao.valorPublicado, licitacao.valorAceito)],
    ]),
    styles: {
      font: "helvetica",
      fontSize: 7.05,
      cellPadding: 1.35,
      lineColor: [166, 207, 173],
      lineWidth: 0.18,
      textColor: [33, 45, 36],
      overflow: "linebreak",
      valign: "top",
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [38, 54, 43],
      fontStyle: "bold",
      fontSize: 6.05,
      cellPadding: 1.15,
    },
    columnStyles: {
      0: { cellWidth: 108 },
      1: { cellWidth: 25, halign: "right" },
      2: { cellWidth: 25, halign: "right" },
      3: { cellWidth: 22, halign: "right", fontStyle: "bold" },
    },
  });

  return (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + headerHeight + 20;
}

function drawFooter(doc: jsPDF, report: ReportData, page: number, totalPages: number) {
  doc.setDrawColor(207, 220, 210);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, FOOTER_Y, PAGE_WIDTH - MARGIN, FOOTER_Y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  doc.setCharSpace(0.35);
  doc.setTextColor(104, 114, 107);
  doc.text(`${report.summary.totalEmpresas} EMPRESAS   ${report.summary.totalLicitacoes} LICITAÇÕES   ${formatCurrency(report.summary.valorContratado)}`, MARGIN, 289);
  doc.setCharSpace(0);
  doc.text(`PÁGINA ${page}/${totalPages}`, PAGE_WIDTH - MARGIN, 289, { align: "right" });
}

export async function downloadReportPdf(report: ReportData): Promise<void> {
  const [logo, watermark] = await Promise.all([imageDataUrl(LOGO_URL), imageDataUrl(LOGO_URL, 0.045)]);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  drawHeader(doc, report, logo);
  drawSummary(doc, report);
  let cursorY = 82.5;

  for (const group of report.groups) {
    const height = estimatedGroupHeight(doc, group);
    if (cursorY + height > FOOTER_Y - 4 && cursorY > 12) {
      doc.addPage();
      cursorY = 10;
    }
    cursorY = drawCompanyGroup(doc, group, cursorY) + 3;
  }

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    drawWatermark(doc, watermark);
    drawFooter(doc, report, page, pages);
  }

  const filename = `relatorio-vencedores-${report.filters.orgao.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-${report.filters.startDate}-${report.filters.endDate}.pdf`;
  doc.save(filename);
}
