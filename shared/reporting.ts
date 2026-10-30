export const FINAL_RESULT_STATUSES = ["Aceita e Habilitada", "Perdida"] as const;

export type AuctionRecord = {
  /** ID exclusivo da linha analisável (por página e lote quando aplicável). */
  id: string;
  /** Identidade da página/licitação original, compartilhada por seus lotes. */
  licitacaoId?: string;
  loteNumero?: number | null;
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
  totalLotes: number;
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

/** Extrai exclusivamente pares "LOTE n: valor"; nunca associa por posição. */
export function parseLotField(value: string): Map<number, string> {
  const entries = new Map<number, string>();
  const marker = /\bLOTE\s*(\d+)\s*:/gi;
  const matches: RegExpExecArray[] = [];
  let current: RegExpExecArray | null;
  while ((current = marker.exec(value)) !== null) matches.push(current);
  matches.forEach((match, index) => {
    const lotNumber = Number(match[1]);
    if (!Number.isSafeInteger(lotNumber) || lotNumber < 1) return;
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? value.length;
    const content = value.slice(start, end).trim().replace(/\s*(?:\/\/|;|\|)\s*$/, "").trim();
    entries.set(lotNumber, content);
  });
  return entries;
}

export type LotFields = { empresa: string; valorPublicado: string; valorAceito: string };

/** Expande campos rotulados em registros individuais e mantém o ID original. */
export function expandAuctionLots(
  base: AuctionRecord,
  fields: LotFields,
): AuctionRecord[] {
  const companyByLot = parseLotField(fields.empresa);
  const publishedByLot = parseLotField(fields.valorPublicado);
  const acceptedByLot = parseLotField(fields.valorAceito);
  const lotNumbers = Array.from(new Set<number>([
    ...Array.from(companyByLot.keys()),
    ...Array.from(publishedByLot.keys()),
    ...Array.from(acceptedByLot.keys()),
  ])).sort((a, b) => a - b);
  if (lotNumbers.length === 0) return [{ ...base, licitacaoId: base.id, loteNumero: null }];
  return lotNumbers.map(loteNumero => ({
    ...base,
    id: `${base.id}#lote-${loteNumero}`,
    licitacaoId: base.id,
    loteNumero,
    empresa: companyByLot.get(loteNumero) ?? "",
    valorPublicado: parseCurrency(publishedByLot.get(loteNumero)),
    valorAceito: parseCurrency(acceptedByLot.get(loteNumero)),
  }));
}

export function parseCurrency(value: string | number | null | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (!value?.trim()) return null;

  const sanitized = value
    .replace(/R\$/gi, "")
    .replace(/\s/g, "")
    .replace(/[^0-9,.-]/g, "");
  const normalized = sanitized.includes(",")
    ? sanitized.replace(/\./g, "").replace(",", ".")
    : sanitized.split(".").length === 2 && /^-?\d+\.\d{2}$/.test(sanitized)
      ? sanitized
      : sanitized.replace(/\./g, "");
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

  const auctionIds = new Set(filteredRecords.map(record => record.licitacaoId ?? record.id));
  return {
    filters,
    records: filteredRecords,
    groups,
    summary: {
      totalEmpresas: groups.length,
      totalLicitacoes: auctionIds.size,
      totalLotes: filteredRecords.filter(record => record.loteNumero != null).length,
      empresaMaiorValorAceito: maiorEmpresa?.empresa ?? null,
      totalMaiorEmpresa: maiorEmpresa?.totalAceito ?? 0,
      maiorContrato,
      valorPublicado,
      valorContratado,
      saldo: valorPublicado - valorContratado,
    },
  };
}
