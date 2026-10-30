import { describe, expect, it } from "vitest";
import { AuctionRecord, buildReport, calculateDiscount, expandAuctionLots, parseCurrency } from "../shared/reporting";

const filters = { orgao: "SEME", startDate: "2026-01-01", endDate: "2026-12-31" };

const records: AuctionRecord[] = [
  {
    id: "1", orgao: "SEME", status: "Aceita e Habilitada", scheduledAt: "2026-02-11T09:00:00.000-03:00",
    empresa: "Empresa Alfa", edital: "01/SEME/2026", processo: "6019.2026/0001", objeto: "Obra A", valorPublicado: 1000, valorAceito: 800,
  },
  {
    id: "2", orgao: "SEME", status: "Perdida", scheduledAt: "2026-03-11T09:00:00.000-03:00",
    empresa: "Empresa Beta", edital: "02/SEME/2026", processo: "6019.2026/0002", objeto: "Obra B", valorPublicado: 2000, valorAceito: 1700,
  },
  {
    id: "3", orgao: "SEME", status: "Captação", scheduledAt: "2026-04-11T09:00:00.000-03:00",
    empresa: "Empresa Alfa", edital: "03/SEME/2026", processo: "6019.2026/0003", objeto: "Obra C", valorPublicado: 600, valorAceito: 500,
  },
  {
    id: "4", orgao: "SUB PENHA", status: "Perdida", scheduledAt: "2026-03-11T09:00:00.000-03:00",
    empresa: "Empresa Gama", edital: "04/SUB/2026", processo: "6048.2026/0004", objeto: "Obra D", valorPublicado: 900, valorAceito: 700,
  },
];

describe("regras do relatório de vencedores", () => {
  it("converte valores brasileiros para número", () => {
    expect(parseCurrency("R$ 1.234.567,89")).toBe(1234567.89);
    expect(parseCurrency("  800,00 ")).toBe(800);
    expect(parseCurrency("1839515.16")).toBe(1839515.16);
    expect(parseCurrency("3289000")).toBe(3289000);
    expect(parseCurrency(250)).toBe(250);
    expect(parseCurrency("")).toBeNull();
  });

  it("filtra os resultados finais, agrupa empresas e calcula os indicadores", () => {
    const report = buildReport(records, filters);

    expect(report.records).toHaveLength(2);
    expect(report.groups.map(group => group.empresa)).toEqual(["Empresa Beta", "Empresa Alfa"]);
    expect(report.summary).toMatchObject({
      totalEmpresas: 2,
      totalLicitacoes: 2,
      empresaMaiorValorAceito: "Empresa Beta",
      totalMaiorEmpresa: 1700,
      maiorContrato: 1700,
      valorPublicado: 3000,
      valorContratado: 2500,
      saldo: 500,
    });
  });

  it("calcula desconto apenas quando os dois valores são válidos", () => {
    expect(calculateDiscount(1000, 750)).toBe(25);
    expect(calculateDiscount(1000, null)).toBeNull();
    expect(calculateDiscount(0, 0)).toBeNull();
  });

  const saoMateusBase: AuctionRecord = {
    id: "sao-mateus", orgao: "SEME", status: "Aceita e Habilitada", scheduledAt: "2026-02-11T09:00:00.000-03:00",
    empresa: "", edital: "Concorrência São Mateus", processo: "SM-2026", objeto: "Obras em São Mateus", valorPublicado: null, valorAceito: null,
  };
  const saoMateus = expandAuctionLots(saoMateusBase, {
    valorPublicado: "LOTE 1: R$ 4.257.351,61 // LOTE 2: R$ 7.460.831,98 // LOTE 3: R$ 8.489.951,69 // LOTE 4: R$ 6.402.299,56 // LOTE 5: R$ 9.217.944,25 // LOTE 6: R$ 4.790.219,05 // LOTE 7: R$ 11.197.441,86 // LOTE 8: R$ 4.547.805,72 // LOTE 9: R$ 9.354.519,83 // LOTE 10: R$ 3.705.830,48",
    empresa: "LOTE 1: CONSÓRCIO VIAS (MATHESIS-ABCON) - MATHESIS ENGENHARIA E CONSTRUÇÃO LTDA // LOTE 2: CONSÓRCIO AMARC (AMARAL-MACOR) // LOTE 3: SOEBE CONSTRUÇÃO E PAVIMENTAÇÃO S/A // LOTE 4: SOEBE CONSTRUÇÃO E PAVIMENTAÇÃO S/A // LOTE 5: CONSÓRCIO AMARC (AMARAL-MACOR) // LOTE 6: CONSTRUTORA KAMILOS LTDA // LOTE 7: SOEBE CONSTRUÇÃO E PAVIMENTAÇÃO S/A // LOTE 8: SOEBE CONSTRUÇÃO E PAVIMENTAÇÃO S/A // LOTE 9: CONSÓRCIO VIAS (MATHESIS-ABCON) - MATHESIS ENGENHARIA E CONSTRUÇÃO LTDA // LOTE 10: SOEBE CONSTRUÇÃO E PAVIMENTAÇÃO S/A",
    valorAceito: "LOTE 1: R$ 4.215.000,00 // LOTE 2: R$ 7.295.000,00 // LOTE 3: R$ 8.335.000,00 // LOTE 4: R$ 6.210.000,00 // LOTE 5: R$ 9.025.000,00 // LOTE 6: R$ 4.660.000,00 // LOTE 7: R$ 10.596.500,00 // LOTE 8: R$ 4.500.000,00 // LOTE 9: R$ 9.070.000,00 // LOTE 10: R$ 3.660.000,00",
  });

  it("gera dois lotes e associa os campos pelo número, não pela posição", () => {
    const lots = expandAuctionLots(saoMateusBase, {
      empresa: "LOTE 1: Alfa // LOTE 2: Beta", valorPublicado: "LOTE 1: R$ 1.234.567,89 // LOTE 2: R$ 2.000,00",
      valorAceito: "LOTE 1: R$ 1.000.000,00 // LOTE 2: R$ 1.500,00",
    });
    expect(lots.map(({ loteNumero, empresa, valorPublicado, valorAceito }) => ({ loteNumero, empresa, valorPublicado, valorAceito }))).toEqual([
      { loteNumero: 1, empresa: "Alfa", valorPublicado: 1234567.89, valorAceito: 1000000 },
      { loteNumero: 2, empresa: "Beta", valorPublicado: 2000, valorAceito: 1500 },
    ]);
  });

  it("processa os dez lotes de São Mateus, agrupa vencedoras e soma sem duplicidade", () => {
    const report = buildReport(saoMateus, filters);
    expect(report.records).toHaveLength(10);
    expect(report.summary).toMatchObject({ totalLicitacoes: 1, totalLotes: 10, totalEmpresas: 4 });
    expect(report.summary.valorPublicado).toBeCloseTo(69424196.03, 2);
    expect(report.summary.valorContratado).toBe(67566500);
    expect(report.summary.saldo).toBeCloseTo(1857696.03, 2);
    const soebe = report.groups.find(group => group.empresa === "SOEBE CONSTRUÇÃO E PAVIMENTAÇÃO S/A");
    expect(soebe?.licitacoes.map(record => record.loteNumero).sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual([3, 4, 7, 8, 10]);
    expect(soebe?.totalAceito).toBe(33301500);
    expect(report.summary.maiorContrato).toBe(10596500);
    expect(calculateDiscount(saoMateus[0].valorPublicado, saoMateus[0].valorAceito)).toBeCloseTo((4257351.61 - 4215000) / 4257351.61 * 100);
  });

  it("não desloca os campos quando falta o número correspondente em uma lista", () => {
    const lots = expandAuctionLots(saoMateusBase, {
      empresa: "LOTE 1: Alfa // LOTE 3: Gama", valorPublicado: "LOTE 1: R$ 100,00 // LOTE 2: R$ 200,00 // LOTE 3: R$ 300,00",
      valorAceito: "LOTE 1: R$ 90,00 // LOTE 3: R$ 270,00",
    });
    expect(lots.map(record => record.loteNumero)).toEqual([1, 2, 3]);
    expect(lots[1]).toMatchObject({ empresa: "", valorPublicado: 200, valorAceito: null });
    expect(lots[2]).toMatchObject({ empresa: "Gama", valorAceito: 270 });
  });

  it("mantém a compatibilidade de licitações antigas sem lotes", () => {
    const legacy = expandAuctionLots(records[0], { empresa: "Empresa Alfa", valorPublicado: "R$ 1.000,00", valorAceito: "R$ 800,00" });
    expect(legacy).toHaveLength(1);
    expect(legacy[0]).toMatchObject({ id: "1", licitacaoId: "1", loteNumero: null, empresa: "Empresa Alfa", valorAceito: 800 });
    expect(buildReport(legacy, filters).summary).toMatchObject({ totalLicitacoes: 1, totalLotes: 0, valorPublicado: 1000, valorContratado: 800 });
  });

  it("conta licitações distintas mesmo quando uma empresa vence vários lotes", () => {
    const report = buildReport(saoMateus, filters);
    expect(report.summary.totalLicitacoes).toBe(1);
    expect(report.groups.reduce((sum, group) => sum + group.licitacoes.length, 0)).toBe(10);
    expect(new Set(report.records.map(record => record.licitacaoId)).size).toBe(1);
  });
});
