import { describe, expect, it } from "vitest";
import { AuctionRecord, buildReport, calculateDiscount, parseCurrency } from "../shared/reporting";

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
});
