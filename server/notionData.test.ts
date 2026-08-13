import { describe, expect, it } from "vitest";
import { getOrgans, getReport } from "./notion";

describe("dados da base Captação Geral", () => {
  it("lista órgãos e consolida um período com resultados finais", async () => {
    const organs = await getOrgans();
    expect(organs).toContain("SEME");

    const report = await getReport({
      orgao: "SEME",
      startDate: "2026-01-01",
      endDate: "2026-07-08",
    });

    expect(report.summary.totalLicitacoes).toBeGreaterThan(0);
    expect(report.summary.totalEmpresas).toBeGreaterThan(0);
    expect(report.summary.valorPublicado).toBeGreaterThan(0);
    expect(report.groups[0]?.empresa).toBeTruthy();
  }, 20_000);
});
