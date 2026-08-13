import autoTable from "jspdf-autotable";
import { jsPDF } from "jspdf";
import { calculateDiscount, type CompanyGroup, type ReportData } from "@shared/reporting";

const LOGO_URL = "/manus-storage/thi-engenharia-arquitetura-oficial_8e77bf2b.png";
const BRAND_GREEN: [number, number, number] = [82, 166, 96];
const SOFT_GREEN: [number, number, number] = [241, 248, 242];
const PAGE_WIDTH = 210;
const MARGIN = 8;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_Y = 286;

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
  doc.addImage(watermark, "PNG", 55, 165, 100, 51);
}

function drawHeader(doc: jsPDF, report: ReportData, logo: string) {
  doc.addImage(logo, "PNG", MARGIN, 10, 23, 11.9);
  doc.setTextColor(80, 90, 84);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.1);
  doc.setCharSpace(1.05);
  doc.text("RELATÓRIO DE VENCEDORES", 35, 13.8);
  doc.setCharSpace(0);
  doc.setTextColor(25, 38, 30);
  doc.setFontSize(18.2);
  doc.text(report.filters.orgao.toUpperCase(), 35, 24.2);

  doc.setDrawColor(183, 215, 190);
  doc.setLineWidth(0.35);
  doc.rect(140, 10, 62, 23);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.7);
  doc.setTextColor(96, 108, 100);
  doc.text("PERÍODO", 144, 17.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.6);
  doc.setTextColor(30, 42, 34);
  doc.text(formatDateRange(report.filters.startDate, report.filters.endDate), 144, 26);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.05);
  doc.setTextColor(91, 101, 95);
  const subtitle = "Consolidado por empresa considerando registros com status perdida ou aceita e habilitada no período selecionado.";
  doc.text(doc.splitTextToSize(subtitle, 132), MARGIN, 41.5);
  doc.setDrawColor(216, 223, 217);
  doc.setLineWidth(0.25);
  doc.line(MARGIN, 50, PAGE_WIDTH - MARGIN, 50);
}

type SummaryCard = { label: string; value: string; detail?: string; width: number };

function drawSummaryCard(doc: jsPDF, x: number, card: SummaryCard) {
  const y = 54;
  const height = 38;
  doc.setDrawColor(211, 232, 215);
  doc.setFillColor(...SOFT_GREEN);
  doc.rect(x, y, card.width, height, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.2);
  doc.setCharSpace(0.42);
  doc.setTextColor(90, 114, 94);
  doc.text(doc.splitTextToSize(card.label.toUpperCase(), card.width - 3.5), x + 1.8, y + 8.4);
  doc.setCharSpace(0);
  doc.setTextColor(27, 43, 33);

  if (card.detail) {
    doc.setFontSize(6.7);
    const companyLines = doc.splitTextToSize(card.value, card.width - 3.5).slice(0, 3);
    doc.text(companyLines, x + 1.8, y + 17.5);
    doc.setFontSize(6.9);
    doc.text(card.detail.replace(/^R\$\s*/, "R$ "), x + 1.8, y + 33);
    return;
  }

  const money = card.value.match(/^R\$\s*(.+)$/);
  if (money) {
    doc.setFontSize(6.9);
    doc.text("R$", x + 1.8, y + 26.5);
    doc.setFontSize(8.1);
    doc.text(money[1], x + 1.8, y + 33.5);
    return;
  }

  doc.setFontSize(11);
  doc.text(card.value, x + 1.8, y + 26.5);
}

function drawSummary(doc: jsPDF, report: ReportData) {
  const cards: SummaryCard[] = [
    { label: "Empresas", value: String(report.summary.totalEmpresas), width: 18.8 },
    { label: "Licitações", value: String(report.summary.totalLicitacoes), width: 19.8 },
    { label: "Empresa c/ maior valor aceito", value: report.summary.empresaMaiorValorAceito ?? "—", detail: formatCurrency(report.summary.totalMaiorEmpresa), width: 30.2 },
    { label: "Maior contrato", value: formatCurrency(report.summary.maiorContrato), width: 27.4 },
    { label: "Valor publicado", value: formatCurrency(report.summary.valorPublicado), width: 27.4 },
    { label: "Valor contratado", value: formatCurrency(report.summary.valorContratado), width: 27.4 },
    { label: "Saldo", value: formatCurrency(report.summary.saldo), width: 26.8 },
  ];
  let x = MARGIN;
  cards.forEach(card => {
    drawSummaryCard(doc, x, card);
    x += card.width + 1;
  });
}

function groupHeaderHeight(doc: jsPDF, group: CompanyGroup): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.2);
  const lines = doc.splitTextToSize(group.empresa.toUpperCase(), 128).length;
  return Math.max(14, 5 + lines * 4.5 + 4.5);
}

function estimatedGroupHeight(doc: jsPDF, group: CompanyGroup): number {
  const header = groupHeaderHeight(doc, group);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const rows = group.licitacoes.reduce((sum, licitacao) => {
    const content = `${licitacao.edital || "Edital não informado"}  ${licitacao.processo ? `Processo: ${licitacao.processo}` : ""}\n${licitacao.objeto || "Objeto não informado."}`;
    const lines = doc.splitTextToSize(content, 105).length;
    return sum + Math.max(17, lines * 3.55 + 7.3);
  }, 0);
  return header + 7 + rows + 5;
}

function drawCompanyGroup(doc: jsPDF, group: CompanyGroup, y: number): number {
  const headerHeight = groupHeaderHeight(doc, group);
  doc.setDrawColor(...BRAND_GREEN);
  doc.setFillColor(252, 253, 252);
  doc.rect(MARGIN, y, CONTENT_WIDTH, headerHeight, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.2);
  doc.setTextColor(32, 43, 35);
  doc.text(doc.splitTextToSize(group.empresa.toUpperCase(), 128), MARGIN + 2.2, y + 5.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.3);
  doc.setTextColor(111, 121, 114);
  doc.text(`${group.licitacoes.length} licitação(ões)`, MARGIN + 2.2, y + headerHeight - 3.4);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(35, 48, 39);
  doc.text(formatCurrency(group.totalAceito), PAGE_WIDTH - MARGIN - 2.2, y + headerHeight - 4.5, { align: "right" });

  autoTable(doc, {
    startY: y + headerHeight,
    margin: { left: MARGIN, right: MARGIN, top: 10, bottom: 14 },
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
      fontSize: 8.5,
      cellPadding: 1.85,
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
      fontSize: 7.05,
      cellPadding: 1.45,
    },
    columnStyles: {
      0: { cellWidth: 105 },
      1: { cellWidth: 26, halign: "right" },
      2: { cellWidth: 26, halign: "right" },
      3: { cellWidth: 23, halign: "right", fontStyle: "bold" },
    },
  });

  return (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + headerHeight + 24;
}

function drawFooter(doc: jsPDF, report: ReportData, page: number, totalPages: number) {
  doc.setDrawColor(207, 220, 210);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, FOOTER_Y, PAGE_WIDTH - MARGIN, FOOTER_Y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setCharSpace(0.35);
  doc.setTextColor(104, 114, 107);
  doc.text(`${report.summary.totalEmpresas} EMPRESAS   ${report.summary.totalLicitacoes} LICITAÇÕES   ${formatCurrency(report.summary.valorContratado)}`, MARGIN, 290.5);
  doc.setCharSpace(0);
  doc.text(`PÁGINA ${page}/${totalPages}`, PAGE_WIDTH - MARGIN, 290.5, { align: "right" });
}

export async function downloadReportPdf(report: ReportData): Promise<void> {
  const [logo, watermark] = await Promise.all([imageDataUrl(LOGO_URL), imageDataUrl(LOGO_URL, 0.035)]);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  drawHeader(doc, report, logo);
  drawSummary(doc, report);
  let cursorY = 97;

  for (const group of report.groups) {
    const height = estimatedGroupHeight(doc, group);
    if (cursorY + height > FOOTER_Y - 4 && cursorY > 12) {
      doc.addPage();
      cursorY = 10;
    }
    cursorY = drawCompanyGroup(doc, group, cursorY) + 5;
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
