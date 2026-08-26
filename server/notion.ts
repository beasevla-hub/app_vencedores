import { AuctionRecord, ReportData, ReportFilters, buildReport, parseCurrency } from "../shared/reporting";

const NOTION_API_URL = "https://api.notion.com/v1";
const NOTION_API_VERSION = "2026-03-11";
const CAPTACAO_GERAL_DATA_SOURCE_ID = "23e503cf-a834-81cb-9786-000b391a57f4";

type NotionRichTextItem = { plain_text?: string };
type NotionProperty = {
  type?: string;
  title?: NotionRichTextItem[];
  rich_text?: NotionRichTextItem[];
  select?: { name?: string | null } | null;
  status?: { name?: string | null } | null;
  date?: { start?: string | null } | null;
};
type NotionPage = { id: string; properties: Record<string, NotionProperty> };
type NotionQueryResponse = { results: NotionPage[]; has_more: boolean; next_cursor: string | null };
type NotionDataSource = {
  properties?: Record<string, { type?: string; select?: { options?: Array<{ name?: string }> } }>;
};

function notionHeaders() {
  const token = process.env.NOTION_API_KEY;
  if (!token) throw new Error("A integração do Notion não está configurada.");

  return {
    Authorization: `Bearer ${token}`,
    "Notion-Version": NOTION_API_VERSION,
    "Content-Type": "application/json",
  };
}

async function notionRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${NOTION_API_URL}${path}`, {
    ...options,
    headers: { ...notionHeaders(), ...options.headers },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? "Não foi possível consultar a base do Notion.");
  }

  return response.json() as Promise<T>;
}

function plainText(property: NotionProperty | undefined): string {
  if (!property) return "";
  if (property.type === "title") return (property.title ?? []).map(item => item.plain_text ?? "").join("").trim();
  if (property.type === "rich_text") return (property.rich_text ?? []).map(item => item.plain_text ?? "").join("").trim();
  if (property.type === "select") return property.select?.name?.trim() ?? "";
  if (property.type === "status") return property.status?.name?.trim() ?? "";
  if (property.type === "date") return property.date?.start?.trim() ?? "";
  return "";
}

function normalizePage(page: NotionPage): AuctionRecord {
  const properties = page.properties;
  return {
    id: page.id,
    orgao: plainText(properties["Sub/Prefeitura"]),
    status: plainText(properties.STATUS),
    scheduledAt: plainText(properties["DATA E HORA"]) || null,
    empresa: plainText(properties["Emp. em Análise"]),
    edital: plainText(properties["N DO EDITAL"]),
    processo: plainText(properties.PROCESSO),
    objeto: plainText(properties.OBJETO),
    valorPublicado: parseCurrency(plainText(properties["VALOR DA OBRA"])),
    valorAceito: parseCurrency(plainText(properties["Valor aceito"])),
  };
}

async function queryPages(filters: ReportFilters): Promise<NotionPage[]> {
  const results: NotionPage[] = [];
  let cursor: string | null = null;

  do {
    const payload: Record<string, unknown> = {
      page_size: 100,
      filter: {
        and: [
          { property: "Sub/Prefeitura", select: { equals: filters.orgao } },
          { property: "DATA E HORA", date: { on_or_after: filters.startDate } },
          { property: "DATA E HORA", date: { on_or_before: filters.endDate } },
          {
            or: [
              { property: "STATUS", status: { equals: "Aceita e Habilitada" } },
              { property: "STATUS", status: { equals: "Perdida" } },
            ],
          },
        ],
      },
    };
    if (cursor) payload.start_cursor = cursor;

    const response = await notionRequest<NotionQueryResponse>(
      `/data_sources/${CAPTACAO_GERAL_DATA_SOURCE_ID}/query`,
      { method: "POST", body: JSON.stringify(payload) },
    );
    results.push(...response.results);
    cursor = response.has_more ? response.next_cursor : null;
  } while (cursor);

  return results;
}

export async function syncNotionBase(): Promise<{ records: number; syncedAt: string }> {
  let records = 0;
  let cursor: string | null = null;

  do {
    const payload: Record<string, unknown> = { page_size: 100 };
    if (cursor) payload.start_cursor = cursor;

    const response = await notionRequest<NotionQueryResponse>(
      `/data_sources/${CAPTACAO_GERAL_DATA_SOURCE_ID}/query`,
      { method: "POST", body: JSON.stringify(payload) },
    );
    records += response.results.length;
    cursor = response.has_more ? response.next_cursor : null;
  } while (cursor);

  return { records, syncedAt: new Date().toISOString() };
}

export async function getOrgans(): Promise<string[]> {
  const source = await notionRequest<NotionDataSource>(`/data_sources/${CAPTACAO_GERAL_DATA_SOURCE_ID}`);
  const options = source.properties?.["Sub/Prefeitura"]?.select?.options ?? [];
  return options
    .map(option => option.name?.trim() ?? "")
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export async function getReport(filters: ReportFilters): Promise<ReportData> {
  const pages = await queryPages(filters);
  return buildReport(pages.map(normalizePage), filters);
}
