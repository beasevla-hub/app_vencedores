export const FINAL_RESULT_STATUSES = ["Aceita e Habilitada", "Perdida"] as const;

export type AuctionRecord = {
  id: string;
  orgao: string;
  status: string;
  scheduledAt: string | null;
  empresa: string;
  edital: string;
  processo: string;
  objeto: string;
  valorPublicado: number | null;
  valorAceito: number | null;
};

export type ReportFilters = {
  orgao: string;
  startDate: string;
  endDate: string;
};

export type CompanyGroup = {
  empresa: string;
  totalAceito: number;
  licitacoes: AuctionRecord[];
};

export type ReportSummary = {
  totalEmpresas: number;
  totalLicitacoes: number;
  empresaMaiorValorAceito: string | null;
  totalMaiorEmpresa: number;
  maiorContrato: number;
  valorPublicado: number;
  valorContratado: number;
  saldo: number;
};

export type ReportData = {
  filters: ReportFilters;
  summary: ReportSummary;
  groups: CompanyGroup[];
  records: AuctionRecord[];
};

export function parseCurrency(value: string | number | null | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (!value?.trim()) return null;

  const normalized = value
    .replace(/R\$/gi, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isReportRecord(record: AuctionRecord, filters: ReportFilters): boolean {
  const recordDate = record.scheduledAt?.slice(0, 10);
  return (
    FINAL_RESULT_STATUSES.includes(record.status as (typeof FINAL_RESULT_STATUSES)[number]) &&
    record.orgao === filters.orgao &&
    Boolean(recordDate && recordDate >= filters.startDate && recordDate <= filters.endDate)
  );
}

export function calculateDiscount(valorPublicado: number | null, valorAceito: number | null): number | null {
  if (valorPublicado === null || valorAceito === null || valorPublicado <= 0) return null;
  return ((valorPublicado - valorAceito) / valorPublicado) * 100;
}

export function buildReport(records: AuctionRecord[], filters: ReportFilters): ReportData {
  const filteredRecords = records.filter(record => isReportRecord(record, filters));
  const groupMap = new Map<string, AuctionRecord[]>();

  for (const record of filteredRecords) {
    const company = record.empresa.trim() || "Empresa não informada";
    const group = groupMap.get(company) ?? [];
    group.push(record);
    groupMap.set(company, group);
  }

  const groups = Array.from(groupMap.entries())
    .map(([empresa, licitacoes]) => ({
      empresa,
      licitacoes: [...licitacoes].sort((a, b) => (b.valorAceito ?? 0) - (a.valorAceito ?? 0)),
      totalAceito: licitacoes.reduce((total, record) => total + (record.valorAceito ?? 0), 0),
    }))
    .sort((a, b) => b.totalAceito - a.totalAceito || a.empresa.localeCompare(b.empresa, "pt-BR"));

  const valorPublicado = filteredRecords.reduce((total, record) => total + (record.valorPublicado ?? 0), 0);
  const valorContratado = filteredRecords.reduce((total, record) => total + (record.valorAceito ?? 0), 0);
  const maiorContrato = filteredRecords.reduce((highest, record) => Math.max(highest, record.valorAceito ?? 0), 0);
  const maiorEmpresa = groups[0];

  return {
    filters,
    records: filteredRecords,
    groups,
    summary: {
      totalEmpresas: groups.length,
      totalLicitacoes: filteredRecords.length,
      empresaMaiorValorAceito: maiorEmpresa?.empresa ?? null,
      totalMaiorEmpresa: maiorEmpresa?.totalAceito ?? 0,
      maiorContrato,
      valorPublicado,
      valorContratado,
      saldo: valorPublicado - valorContratado,
    },
  };
}
