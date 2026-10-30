export const FINAL_RESULT_STATUSES = ["Aceita e Habilitada", "Perdida"] as const;

export type AuctionRecord = {
  /** ID exclusivo da linha analisável (por página e lote quando aplicável). */
  id: string;
  /** Identidade da página/licitação original, compartilhada por seus lotes. */
  licitacaoId?: string;
  loteNumero?: number | null;
  empresaOriginal?: string;
  empresaId?: string;
  cnpj?: string | null;
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

/** Cadastro controlado: aliases só são unidos quando explicitamente cadastrados. */
export const COMPANY_ALIASES: ReadonlyArray<{ canonicalName: string; aliases: readonly string[] }> = [
  {
    canonicalName: "AMARAL CONSTRUÇÕES E COMÉRCIO LTDA",
    aliases: [
      "AMARAL CONSTRUCOES E COMERCIO",
      "AMARAL CONSTRUCOES E COMERCIO LTDA",
      "AMARAL CONSTRUÇÕES, E COMÉRCIO",
      "AMARAL CONSTRUÇÕES, E COMÉRCIO LTDA",
      "AMARAL CONSTRUÇÕES & COMÉRCIO",
      "AMARAL CONSTRUÇÕES & COMÉRCIO LTDA",
      "Amaral Construções e Comercio LTDA.",
    ],
  },
];

/** Chave determinística: acentos, caixa, pontuação, espaços e conectivo & são ignorados. */
export function normalizeCompanyName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleUpperCase("pt-BR")
    .replace(/&/g, " E ")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\bS\s+A\b/g, "SA");
}

export type CompanyIdentity = { id: string; canonicalName: string; originalName: string; cnpj: string | null };
const COMPANY_ALIAS_LOOKUP = new Map<string, string>();
for (const entry of COMPANY_ALIASES) {
  COMPANY_ALIAS_LOOKUP.set(normalizeCompanyName(entry.canonicalName), entry.canonicalName);
  for (const alias of entry.aliases) COMPANY_ALIAS_LOOKUP.set(normalizeCompanyName(alias), entry.canonicalName);
}

/** Não usa similaridade aproximada para mesclar: nomes só se unem por chave exata ou alias. */
export function identifyCompany(name: string, cnpj?: string | null): CompanyIdentity {
  const originalName = name.trim();
  const normalizedName = normalizeCompanyName(originalName);
  const digits = cnpj?.replace(/\D/g, "") ?? "";
  const normalizedCnpj = digits.length === 14 ? digits : null;
  const registeredCanonical = COMPANY_ALIAS_LOOKUP.get(normalizedName);
  const canonicalName = registeredCanonical ?? (originalName || "Empresa não informada");
  const canonicalKey = normalizeCompanyName(registeredCanonical ?? originalName) || "EMPRESA NÃO INFORMADA";
  return {
    id: normalizedCnpj ? `cnpj:${normalizedCnpj}` : `nome:${canonicalKey}`,
    canonicalName,
    originalName,
    cnpj: normalizedCnpj,
  };
}

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
  if (lotNumbers.length === 0) return [{ ...base, licitacaoId: base.id, loteNumero: null, empresaOriginal: base.empresaOriginal ?? base.empresa }];
  return lotNumbers.map(loteNumero => ({
    ...base,
    id: `${base.id}#lote-${loteNumero}`,
    licitacaoId: base.id,
    loteNumero,
    empresa: companyByLot.get(loteNumero) ?? "",
    empresaOriginal: companyByLot.get(loteNumero) ?? "",
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
  const filteredRecords = records
    .filter(record => isReportRecord(record, filters))
    .map(record => {
      const identity = identifyCompany(record.empresaOriginal ?? record.empresa, record.cnpj);
      return { ...record, empresa: identity.canonicalName, empresaId: identity.id, empresaOriginal: identity.originalName };
    });
  const groupMap = new Map<string, AuctionRecord[]>();
  for (const record of filteredRecords) {
    const identity = record.empresaId ?? identifyCompany(record.empresaOriginal ?? record.empresa, record.cnpj).id;
    const group = groupMap.get(identity) ?? [];
    group.push(record);
    groupMap.set(identity, group);
  }
  const groups = Array.from(groupMap.entries())
    .map(([, licitacoes]) => ({
      empresa: licitacoes[0].empresa,
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
