export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatPercent(value: number | null | undefined, fractionDigits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)}%`;
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

export function formatDateRange(startDate: string, endDate: string): string {
  return `${formatDate(startDate)} até ${formatDate(endDate)}`;
}

/**
 * Alguns registros antigos do Notion têm um valor monetário no campo de empresa.
 * Não transformamos esse dado em um nome de empresa no relatório.
 */
export function displayCompanyName(value: string | null | undefined): string {
  const name = value?.trim() ?? "";
  const currencyLike = /^R\$\s*-?[\d.,\s]+$/i.test(name) || /^-?[\d.,\s]+$/.test(name);
  return !name || currencyLike ? "Empresa não informada" : name;
}
