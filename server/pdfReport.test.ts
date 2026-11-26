import { buildReport, type AuctionRecord } from "@shared/reporting";
import { displayCompanyName } from "@/lib/format";
import { buildReportPdf, reportPdfFilename } from "@/lib/pdfReport";
import { describe, expect, it } from "vitest";

const filters = { orgao: "SUB SÉ / OESTE", startDate: "2026-01-01", endDate: "2026-12-31" };

function auctionRecord(index: number, empresa: string, overrides: Partial<AuctionRecord> = {}): AuctionRecord {
  return {
    id: `page-${index}`,
    licitacaoId: `page-${index}`,
    loteNumero: null,
    empresaOriginal: empresa,
    empresa,
    orgao: filters.orgao,
    status: "Aceita e Habilitada",
    scheduledAt: "2026-06-15T10:00:00.000-03:00",
    edital: `EDITAL ${String(index).padStart(4, "0")}`,
    processo: `PROCESSO-${index}`,
    objeto: "Prestação de serviços de engenharia, manutenção predial e execução de obras com descrição suficientemente longa para exercitar a quebra de linha da tabela do relatório.",
    valorPublicado: 1_500_000 + index,
    valorAceito: 1_200_000 + index,
    ...overrides,
  };
}

describe("pdfReport", () => {
  it("gera nome de arquivo estável sem acentos ou caracteres inválidos", () => {
    expect(reportPdfFilename(buildReport([], filters))).toBe("relatorio-vencedores-sub-se-oeste-2026-01-01-2026-12-31.pdf");
  });

  it("não apresenta um valor monetário como nome de empresa", () => {
    expect(displayCompanyName("R$ 823.000,00")).toBe("Empresa não informada");
    expect(displayCompanyName("Construtora Brasfort Ltda")).toBe("Construtora Brasfort Ltda");
  });

  it("gera um PDF válido para relatório vazio", () => {
    const report = buildReport([], filters);
    const doc = buildReportPdf(report);
    expect(doc.getNumberOfPages()).toBe(1);
    expect(doc.output("arraybuffer").byteLength).toBeGreaterThan(1_000);
  });

  it("pagina relatórios com muitas empresas, lotes e descrições longas", () => {
    const records: AuctionRecord[] = [];
    for (let company = 0; company < 18; company += 1) {
      const empresa = `EMPRESA DE ENGENHARIA E CONSTRUÇÕES ${company} LTDA`;
      for (let row = 0; row < 6; row += 1) {
        records.push(auctionRecord(company * 10 + row, empresa, { loteNumero: row % 2 === 0 ? row + 1 : null }));
      }
    }

    const report = buildReport(records, filters);
    const doc = buildReportPdf(report);
    expect(report.groups).toHaveLength(18);
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
    expect(doc.output("arraybuffer").byteLength).toBeGreaterThan(10_000);
  });
});
