import { displayCompanyName, formatCurrency, formatPercent } from "@/lib/format";
import { calculateDiscount, type CompanyGroup } from "@shared/reporting";
import { Building2, FileText, Layers3 } from "lucide-react";

function DiscountBadge({ published, accepted }: { published: number | null; accepted: number | null }) {
  const discount = calculateDiscount(published, accepted);
  if (discount === null) return <span className="text-xs text-muted-foreground">—</span>;
  const positive = discount >= 0;
  return (
    <span
      className={
        positive
          ? "inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-brand-700"
          : "inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-red-700"
      }
    >
      {formatPercent(discount)}
    </span>
  );
}

function DocumentInfo({ record, companyName, compact = false }: { record: CompanyGroup["licitacoes"][number]; companyName: string; compact?: boolean }) {
  return (
    <div className={compact ? "min-w-0" : "max-w-2xl"}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[12px] font-semibold text-ink">{record.edital || "Edital não informado"}</span>
        {record.loteNumero != null ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
            <Layers3 className="size-3" /> Lote {record.loteNumero}
          </span>
        ) : null}
        {record.processo ? <span className="text-[10px] text-muted-foreground">Processo {record.processo}</span> : null}
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{record.objeto || "Objeto não informado."}</p>
      {record.empresaOriginal && record.empresaOriginal !== companyName ? (
        <p className="mt-1 text-[10px] text-muted-foreground/90">Nome no Notion: {record.empresaOriginal}</p>
      ) : null}
    </div>
  );
}

export function CompanyReportGroup({ group, index }: { group: CompanyGroup; index: number }) {
  const totalLicitacoes = new Set(group.licitacoes.map(record => record.licitacaoId ?? record.id)).size;
  const totalLotes = group.licitacoes.filter(record => record.loteNumero != null).length;
  const companyName = displayCompanyName(group.empresa);

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(22,35,27,0.03)]">
      <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-[11px] font-bold tabular-nums text-brand-700">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <h3 className="break-words text-[13px] font-semibold uppercase leading-snug tracking-[-0.01em] text-ink">{companyName}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <FileText className="size-3" /> {totalLicitacoes} {totalLicitacoes === 1 ? "licitação" : "licitações"}
              </span>
              <span className="inline-flex items-center gap-1">
                <Layers3 className="size-3" /> {totalLotes} lote{totalLotes === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-end justify-between gap-4 border-t border-line pt-3 sm:block sm:border-0 sm:pt-0 sm:text-right">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Total aceito</p>
          <p className="text-lg font-semibold tabular-nums tracking-[-0.03em] text-brand-700">{formatCurrency(group.totalAceito)}</p>
        </div>
      </div>

      <div className="hidden md:block">
        <table className="w-full table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[54%]" />
            <col className="w-[15%]" />
            <col className="w-[17%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-line bg-[#FAFCF9] text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-5 py-2.5 font-semibold">Licitação / lote</th>
              <th className="px-3 py-2.5 text-right font-semibold">Valor edital</th>
              <th className="px-3 py-2.5 text-right font-semibold">Valor aceito</th>
              <th className="px-5 py-2.5 text-right font-semibold">Desconto</th>
            </tr>
          </thead>
          <tbody>
            {group.licitacoes.map(record => (
              <tr key={record.id} className="border-b border-line/70 last:border-0 hover:bg-brand-50/35">
                <td className="px-5 py-3 align-top">
                  <DocumentInfo record={record} companyName={companyName} />
                </td>
                <td className="px-3 py-3 text-right align-top text-[11px] font-medium tabular-nums text-ink/80">{formatCurrency(record.valorPublicado)}</td>
                <td className="px-3 py-3 text-right align-top text-[11px] font-semibold tabular-nums text-brand-700">{formatCurrency(record.valorAceito)}</td>
                <td className="px-5 py-3 text-right align-top">
                  <DiscountBadge published={record.valorPublicado} accepted={record.valorAceito} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-line md:hidden">
        {group.licitacoes.map(record => (
          <div key={record.id} className="p-4">
            <DocumentInfo record={record} companyName={companyName} compact />
            <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-[#FAFCF9] p-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Valor edital</p>
                <p className="mt-1 text-[11px] font-medium tabular-nums text-ink">{formatCurrency(record.valorPublicado)}</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Aceito</p>
                <p className="mt-1 text-[11px] font-semibold tabular-nums text-brand-700">{formatCurrency(record.valorAceito)}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Desconto</p>
                <div className="mt-1">
                  <DiscountBadge published={record.valorPublicado} accepted={record.valorAceito} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {group.licitacoes.length === 0 ? (
        <div className="flex items-center gap-2 px-5 py-8 text-sm text-muted-foreground">
          <Building2 className="size-4" /> Nenhuma licitação neste grupo.
        </div>
      ) : null}
    </section>
  );
}
