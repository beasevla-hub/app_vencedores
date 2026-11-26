import autoTable from "jspdf-autotable";
import { jsPDF } from "jspdf";
import { calculateDiscount, type CompanyGroup, type ReportData } from "@shared/reporting";
import { displayCompanyName, formatCurrency, formatDateRange, formatPercent } from "@/lib/format";

const LOGO_URL = "/thi-logo.png";
const PAGE_WIDTH = 210;
const MARGIN = 12;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const CONTENT_BOTTOM = 279;
const RUNNING_HEADER_BOTTOM = 21;
const FOOTER_LINE_Y = 283;

type RGB = [number, number, number];
const COLORS: Record<"ink" | "muted" | "line" | "brand" | "brand700" | "brand600" | "brand200" | "soft" | "white", RGB> = {
  ink: [22, 35, 27],
  muted: [102, 115, 106],
  line: [221, 229, 218],
  brand: [23, 76, 43],
  brand700: [31, 97, 55],
  brand600: [47, 122, 69],
  brand200: [201, 223, 198],
  soft: [250, 252, 249],
  white: [255, 255, 255],
};

type BrandImages = { logo: string | null; watermark: string | null };

function pdfCurrency(value: number | null | undefined): string {
  return formatCurrency(value).replace(/\u00A0/g, " ");
}

function pdfPercent(value: number | null | undefined, digits = 2): string {
  return formatPercent(value, digits).replace(/\u00A0/g, " ");
}

function pdfDateRange(startDate: string, endDate: string): string {
  return formatDateRange(startDate, endDate).replace(/\u00A0/g, " ");
}

function setFill(doc: jsPDF, color: RGB) {
  doc.setFillColor(color[0], color[1], color[2]);
}

function setDraw(doc: jsPDF, color: RGB) {
  doc.setDrawColor(color[0], color[1], color[2]);
}

function setText(doc: jsPDF, color: RGB) {
  doc.setTextColor(color[0], color[1], color[2]);
}

function fitFontSize(doc: jsPDF, text: string, maxWidth: number, preferred: number, minimum = 6): number {
  let size = preferred;
  doc.setFontSize(size);
  while (size > minimum && doc.getTextWidth(text) > maxWidth) {
    size = Math.max(minimum, size - 0.25);
    doc.setFontSize(size);
  }
  return size;
}

function truncateText(doc: jsPDF, text: string, maxWidth: number): string {
  if (doc.getTextWidth(text) <= maxWidth) return text;
  let output = text;
  while (output.length > 1 && doc.getTextWidth(`${output}…`) > maxWidth) output = output.slice(0, -1);
  return `${output.trimEnd()}…`;
}

function fitLines(doc: jsPDF, text: string, maxWidth: number, maxLines: number, preferredSize: number, minimumSize: number): string[] {
  let size = preferredSize;
  doc.setFontSize(size);
  let lines = doc.splitTextToSize(text, maxWidth);
  while (lines.length > maxLines && size > minimumSize) {
    size = Math.max(minimumSize, size - 0.25);
    doc.setFontSize(size);
    lines = doc.splitTextToSize(text, maxWidth);
  }
  return lines.slice(0, maxLines);
}

function drawFallbackMark(doc: jsPDF, x: number, y: number, height: number) {
  const width = height * 1.45;
  setFill(doc, COLORS.brand);
  doc.roundedRect(x, y, width, height, 1.6, 1.6, "F");
  setText(doc, COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(height * 0.42);
  doc.text("THI", x + width / 2, y + height / 2 + height * 0.14, { align: "center" });
}

function drawLogo(doc: jsPDF, logo: string | null, x: number, y: number, maxWidth: number, maxHeight: number): number {
  if (!logo) {
    drawFallbackMark(doc, x, y, maxHeight);
    return maxHeight * 1.45;
  }
  try {
    const properties = doc.getImageProperties(logo);
    const ratio = properties.width / properties.height;
    let height = maxHeight;
    let width = height * ratio;
    if (width > maxWidth) {
      width = maxWidth;
      height = width / ratio;
    }
    doc.addImage(logo, "PNG", x, y + (maxHeight - height) / 2, width, height);
    return width;
  } catch {
    drawFallbackMark(doc, x, y, maxHeight);
    return maxHeight * 1.45;
  }
}

function drawDocumentHeader(doc: jsPDF, report: ReportData, logo: string | null) {
  drawLogo(doc, logo, MARGIN, 10, 29, 14);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.7);
  setText(doc, COLORS.muted);
  doc.setCharSpace(1.05);
  doc.text("RELATÓRIO DE VENCEDORES", 46, 13.4);
  doc.setCharSpace(0);

  doc.setFont("helvetica", "bold");
  setText(doc, COLORS.ink);
  const titleLines = fitLines(doc, report.filters.orgao.toUpperCase(), 86, 2, 15, 10.5);
  doc.text(titleLines, 46, 21.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setText(doc, COLORS.muted);
  doc.text("Captação Geral · resultados finais consolidados", 46, 21.5 + titleLines.length * 5.1 + 1.5);

  setDraw(doc, COLORS.brand200);
  doc.setLineWidth(0.3);
  doc.roundedRect(138, 10, 60, 25, 2, 2, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.2);
  setText(doc, COLORS.muted);
  doc.setCharSpace(0.7);
  doc.text("PERÍODO", 142, 16);
  doc.setCharSpace(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  setText(doc, COLORS.ink);
  doc.text(doc.splitTextToSize(pdfDateRange(report.filters.startDate, report.filters.endDate), 52), 142, 22.5);

  setDraw(doc, COLORS.line);
  doc.setLineWidth(0.25);
  doc.line(MARGIN, 39.5, PAGE_WIDTH - MARGIN, 39.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setText(doc, COLORS.brand700);
  doc.setCharSpace(0.7);
  doc.text("RESUMO FINANCEIRO", MARGIN, 45.5);
  doc.setCharSpace(0);
}

function drawRunningHeader(doc: jsPDF, report: ReportData, logo: string | null, companyName?: string) {
  drawLogo(doc, logo, MARGIN, 8, 20, 7);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.4);
  setText(doc, COLORS.ink);
  doc.text("RELATÓRIO DE VENCEDORES", 36, 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.4);
  setText(doc, COLORS.muted);
  const continuation = companyName ? `Continuação · ${companyName.toUpperCase()}` : report.filters.orgao.toUpperCase();
  doc.text(truncateText(doc, continuation, 86), 36, 15.2);
  doc.text(pdfDateRange(report.filters.startDate, report.filters.endDate), PAGE_WIDTH - MARGIN, 11, { align: "right" });
  setDraw(doc, COLORS.line);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, RUNNING_HEADER_BOTTOM - 1.5, PAGE_WIDTH - MARGIN, RUNNING_HEADER_BOTTOM - 1.5);
}

function drawMetricCard(doc: jsPDF, x: number, y: number, width: number, height: number, label: string, value: string) {
  setFill(doc, COLORS.white);
  setDraw(doc, COLORS.line);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, width, height, 1.8, 1.8, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.9);
  setText(doc, COLORS.muted);
  doc.setCharSpace(0.35);
  doc.text(truncateText(doc, label.toUpperCase(), width - 6), x + 3, y + 6);
  doc.setCharSpace(0);
  setText(doc, COLORS.ink);
  fitFontSize(doc, value, width - 6, 10, 7.2);
  doc.text(value, x + 3, y + 14.2);
}

function drawSummary(doc: jsPDF, report: ReportData) {
  const { summary } = report;
  const discount = calculateDiscount(summary.valorPublicado, summary.valorContratado);
  const top = 50;
  const darkWidth = 88;
  const darkHeight = 42;

  setFill(doc, COLORS.brand);
  doc.roundedRect(MARGIN, top, darkWidth, darkHeight, 2.5, 2.5, "F");
  setText(doc, COLORS.brand200);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.1);
  doc.setCharSpace(0.55);
  doc.text("VALOR CONTRATADO", MARGIN + 4, top + 6.2);
  doc.setCharSpace(0);

  setText(doc, COLORS.white);
  fitFontSize(doc, pdfCurrency(summary.valorContratado), darkWidth - 8, 16, 10);
  doc.text(pdfCurrency(summary.valorContratado), MARGIN + 4, top + 16.2);

  setDraw(doc, [58, 103, 73]);
  doc.setLineWidth(0.2);
  doc.line(MARGIN + 4, top + 21.5, MARGIN + darkWidth - 4, top + 21.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  setText(doc, COLORS.brand200);
  doc.text("VALOR PUBLICADO", MARGIN + 4, top + 26.2);
  doc.text("ECONOMIA", MARGIN + 46, top + 26.2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.4);
  setText(doc, COLORS.white);
  fitFontSize(doc, pdfCurrency(summary.valorPublicado), 39, 7.4, 6.2);
  doc.text(pdfCurrency(summary.valorPublicado), MARGIN + 4, top + 31.5);
  fitFontSize(doc, pdfCurrency(summary.saldo), 39, 7.4, 6.2);
  doc.text(pdfCurrency(summary.saldo), MARGIN + 46, top + 31.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  setText(doc, COLORS.brand200);
  doc.text("DESCONTO MÉDIO", MARGIN + 4, top + 37.2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.6);
  setText(doc, COLORS.white);
  doc.text(discount === null ? "—" : pdfPercent(discount), MARGIN + darkWidth - 4, top + 37.2, { align: "right" });

  const gridX = 104;
  const gridWidth = CONTENT_WIDTH - (gridX - MARGIN);
  const gap = 2;
  const cellWidth = (gridWidth - gap) / 2;
  const cellHeight = 20;
  const metrics = [
    { label: "Empresas", value: String(summary.totalEmpresas) },
    { label: "Licitações", value: String(summary.totalLicitacoes) },
    { label: "Lotes", value: String(summary.totalLotes) },
    { label: "Maior contrato", value: pdfCurrency(summary.maiorContrato) },
  ];
  metrics.forEach((metric, index) => {
    const x = gridX + (index % 2) * (cellWidth + gap);
    const y = top + Math.floor(index / 2) * (cellHeight + gap);
    drawMetricCard(doc, x, y, cellWidth, cellHeight, metric.label, metric.value);
  });

  const leaderY = top + darkHeight + 3;
  const leaderHeight = 17;
  setFill(doc, COLORS.soft);
  setDraw(doc, COLORS.line);
  doc.setLineWidth(0.2);
  doc.roundedRect(MARGIN, leaderY, CONTENT_WIDTH, leaderHeight, 1.8, 1.8, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.9);
  setText(doc, COLORS.muted);
  doc.setCharSpace(0.35);
  doc.text("EMPRESA COM MAIOR VALOR ACEITO", MARGIN + 4, leaderY + 5.4);
  doc.setCharSpace(0);
  doc.setFont("helvetica", "bold");
  setText(doc, COLORS.ink);
  const leaderName = displayCompanyName(summary.empresaMaiorValorAceito);
  const leaderLines = fitLines(doc, leaderName.toUpperCase(), 130, 2, 8.4, 6.8);
  doc.text(leaderLines, MARGIN + 4, leaderY + 10.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.9);
  setText(doc, COLORS.muted);
  doc.text("TOTAL ACEITO", PAGE_WIDTH - MARGIN - 4, leaderY + 5.4, { align: "right" });
  doc.setFont("helvetica", "bold");
  fitFontSize(doc, pdfCurrency(summary.totalMaiorEmpresa), 44, 9.2, 7);
  setText(doc, COLORS.brand700);
  doc.text(pdfCurrency(summary.totalMaiorEmpresa), PAGE_WIDTH - MARGIN - 4, leaderY + 11.8, { align: "right" });
}

function groupHeaderHeight(doc: jsPDF, group: CompanyGroup): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.6);
  const lines = doc.splitTextToSize(displayCompanyName(group.empresa).toUpperCase(), 126).length;
  return Math.max(17, 7 + lines * 4.1 + 3.2);
}

function groupHeader(doc: jsPDF, group: CompanyGroup, y: number): number {
  const totalLicitacoes = new Set(group.licitacoes.map(record => record.licitacaoId ?? record.id)).size;
  const totalLotes = group.licitacoes.filter(record => record.loteNumero != null).length;
  const height = groupHeaderHeight(doc, group);

  setFill(doc, COLORS.soft);
  setDraw(doc, COLORS.line);
  doc.setLineWidth(0.2);
  doc.rect(MARGIN, y, CONTENT_WIDTH, height, "FD");
  setFill(doc, COLORS.brand600);
  doc.rect(MARGIN, y, 1.4, height, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.6);
  setText(doc, COLORS.ink);
  const nameLines = doc.splitTextToSize(displayCompanyName(group.empresa).toUpperCase(), 126);
  doc.text(nameLines, MARGIN + 4, y + 6.8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  setText(doc, COLORS.muted);
  doc.text(`${totalLicitacoes} ${totalLicitacoes === 1 ? "licitação" : "licitações"} · ${totalLotes} lote${totalLotes === 1 ? "" : "s"}`, MARGIN + 4, y + height - 3);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.8);
  setText(doc, COLORS.muted);
  doc.text("TOTAL ACEITO", PAGE_WIDTH - MARGIN - 4, y + 5.8, { align: "right" });
  fitFontSize(doc, pdfCurrency(group.totalAceito), 43, 9.2, 7);
  setText(doc, COLORS.brand700);
  doc.text(pdfCurrency(group.totalAceito), PAGE_WIDTH - MARGIN - 4, y + 11.8, { align: "right" });

  return height;
}

function tableContent(record: CompanyGroup["licitacoes"][number], companyName: string): string {
  const title = `${record.edital || "Edital não informado"}${record.loteNumero != null ? ` · Lote ${record.loteNumero}` : ""}${record.processo ? ` · Processo: ${record.processo}` : ""}`;
  const lines = [title, record.objeto || "Objeto não informado."];
  if (record.empresaOriginal && record.empresaOriginal !== companyName) lines.push(`Nome no Notion: ${record.empresaOriginal}`);
  return lines.join("\n");
}

function estimatedGroupHeight(doc: jsPDF, group: CompanyGroup): number {
  const header = groupHeaderHeight(doc, group);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.1);
  const companyName = displayCompanyName(group.empresa);
  const rows = group.licitacoes.reduce((sum, record) => {
    const lines = doc.splitTextToSize(tableContent(record, companyName), 94).length;
    return sum + Math.max(13, lines * 3.35 + 6);
  }, 0);
  return header + 7 + rows + 4;
}

function drawCompanyGroup(doc: jsPDF, group: CompanyGroup, y: number, pageCompany: Map<number, string>): number {
  const headerHeight = groupHeader(doc, group, y);
  const companyName = displayCompanyName(group.empresa);

  autoTable(doc, {
    startY: y + headerHeight,
    margin: { left: MARGIN, right: MARGIN, top: RUNNING_HEADER_BOTTOM + 3, bottom: 18 },
    tableWidth: CONTENT_WIDTH,
    theme: "grid",
    rowPageBreak: "avoid",
    showHead: "everyPage",
    head: [["LICITAÇÃO / LOTE", "VALOR EDITAL", "VALOR ACEITO", "DESCONTO"]],
    body: group.licitacoes.map(record => [
      tableContent(record, companyName),
      pdfCurrency(record.valorPublicado),
      pdfCurrency(record.valorAceito),
      pdfPercent(calculateDiscount(record.valorPublicado, record.valorAceito)),
    ]),
    styles: {
      font: "helvetica",
      fontSize: 8.1,
      cellPadding: 2,
      lineColor: COLORS.line,
      lineWidth: 0.12,
      textColor: COLORS.ink,
      overflow: "linebreak",
      valign: "top",
    },
    headStyles: {
      fillColor: COLORS.soft,
      textColor: COLORS.muted,
      fontStyle: "bold",
      fontSize: 6.7,
      cellPadding: 1.8,
      lineWidth: 0.12,
    },
    alternateRowStyles: {
      fillColor: [253, 254, 253],
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 30, halign: "right" },
      2: { cellWidth: 32, halign: "right", fontStyle: "bold" },
      3: { cellWidth: 24, halign: "right", fontStyle: "bold" },
    },
    didDrawPage: data => {
      if (!pageCompany.has(data.pageNumber)) pageCompany.set(data.pageNumber, companyName);
    },
  });

  return (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + headerHeight + 24;
}

function drawFooter(doc: jsPDF, report: ReportData, page: number, totalPages: number) {
  setDraw(doc, COLORS.line);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, FOOTER_LINE_Y, PAGE_WIDTH - MARGIN, FOOTER_LINE_Y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.1);
  setText(doc, COLORS.muted);
  const totals = `${report.summary.totalEmpresas} ${report.summary.totalEmpresas === 1 ? "empresa" : "empresas"} · ${report.summary.totalLicitacoes} ${report.summary.totalLicitacoes === 1 ? "licitação" : "licitações"} · ${report.summary.totalLotes} ${report.summary.totalLotes === 1 ? "lote" : "lotes"} · ${pdfCurrency(report.summary.valorContratado)}`;
  doc.text(truncateText(doc, totals, 138), MARGIN, 288);
  doc.text(`PÁGINA ${page}/${totalPages}`, PAGE_WIDTH - MARGIN, 288, { align: "right" });
}

function drawWatermark(doc: jsPDF, watermark: string | null) {
  if (!watermark) return;
  try {
    doc.addImage(watermark, "PNG", 55, 154, 100, 51.6);
  } catch {
    // O relatório continua válido sem a marca d'água.
  }
}

export function reportPdfFilename(report: ReportData): string {
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  return `relatorio-vencedores-${normalize(report.filters.orgao) || "orgao"}-${report.filters.startDate}-${report.filters.endDate}.pdf`;
}

export function buildReportPdf(report: ReportData, images: BrandImages = { logo: null, watermark: null }): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  doc.setProperties({
    title: `Relatório de vencedores · ${report.filters.orgao}`,
    subject: `Licitações finalizadas entre ${report.filters.startDate} e ${report.filters.endDate}`,
    author: "THI Engenharia e Arquitetura",
    creator: "Painel de Licitações THI",
  });

  drawDocumentHeader(doc, report, images.logo);
  drawSummary(doc, report);

  const freshPageStart = RUNNING_HEADER_BOTTOM + 3;
  const pageCompany = new Map<number, string>();
  let cursorY = 116;

  for (const group of report.groups) {
    const height = estimatedGroupHeight(doc, group);
    const available = CONTENT_BOTTOM - cursorY;
    const availableOnFreshPage = CONTENT_BOTTOM - freshPageStart;
    const minimumStart = groupHeaderHeight(doc, group) + 12;

    // Grupos pequenos que não cabem no espaço restante começam inteiros na página seguinte.
    // Grupos grandes são divididos para não gerar uma página quase vazia após o resumo.
    if (available < minimumStart || (available < 60 && height <= availableOnFreshPage)) {
      doc.addPage();
      cursorY = freshPageStart;
    }

    cursorY = drawCompanyGroup(doc, group, cursorY, pageCompany) + 6;
  }

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    if (page > 1) drawRunningHeader(doc, report, images.logo, pageCompany.get(page));
    drawWatermark(doc, images.watermark);
    drawFooter(doc, report, page, pages);
  }

  return doc;
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
    context.drawImage(image, 0, 0);

    if (opacity < 1) {
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      for (let index = 0; index < pixels.data.length; index += 4) {
        const red = pixels.data[index];
        const green = pixels.data[index + 1];
        const blue = pixels.data[index + 2];
        const alpha = pixels.data[index + 3];
        const isWhiteBackground = red > 235 && green > 235 && blue > 235;
        pixels.data[index + 3] = isWhiteBackground ? 0 : Math.round(alpha * opacity);
      }
      context.putImageData(pixels, 0, 0);
    }

    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

let brandImagesCache: BrandImages | null = null;

async function loadBrandImages(): Promise<BrandImages> {
  if (brandImagesCache) return brandImagesCache;
  try {
    const [logo, watermark] = await Promise.all([imageDataUrl(LOGO_URL), imageDataUrl(LOGO_URL, 0.035)]);
    brandImagesCache = { logo, watermark };
    return brandImagesCache;
  } catch {
    // O PDF usa uma marca vetorial simples se o arquivo de marca não estiver disponível.
    return { logo: null, watermark: null };
  }
}

export async function downloadReportPdf(report: ReportData): Promise<void> {
  const images = await loadBrandImages();
  const doc = buildReportPdf(report, images);
  doc.save(reportPdfFilename(report));
}
