import { displayCompanyName, formatCurrency, formatPercent } from "@/lib/format";
import { calculateDiscount, type ReportData } from "@shared/reporting";
import { ArrowUpRight, FileText, Layers3, Trophy, Users } from "lucide-react";

const summaryMetrics = [
  { key: "empresas", label: "Empresas", icon: Users },
  { key: "licitacoes", label: "Licitações", icon: FileText },
  { key: "lotes", label: "Lotes", icon: Layers3 },
] as const;

export function ReportOverview({ report }: { report: ReportData }) {
  const { summary } = report;
  const discount = calculateDiscount(summary.valorPublicado, summary.valorContratado);
  const discountWidth = discount === null ? 0 : Math.max(0, Math.min(100, discount));
  const leaderShare = summary.valorContratado > 0 ? (summary.totalMaiorEmpresa / summary.valorContratado) * 100 : 0;
  const leaderName = displayCompanyName(summary.empresaMaiorValorAceito);

  return (
    <section aria-label="Resumo financeiro do relatório" className="mt-5 space-y-3">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <div className="relative overflow-hidden rounded-2xl bg-brand-800 p-5 text-white shadow-[0_18px_45px_-28px_rgba(23,76,43,0.7)] sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-6 -top-8 size-32 rounded-full bg-white/[0.04]" />
          <div className="relative">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-200">Valor contratado</p>
              <span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-medium text-brand-100">Resultado final</span>
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums tracking-[-0.045em] sm:text-4xl">{formatCurrency(summary.valorContratado)}</p>

            <div className="mt-6 grid grid-cols-2 gap-5 border-t border-white/15 pt-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-brand-200">Valor publicado</p>
                <p className="mt-1 text-sm font-medium tabular-nums text-white">{formatCurrency(summary.valorPublicado)}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-brand-200">Economia</p>
                <p className="mt-1 text-sm font-medium tabular-nums text-white">{formatCurrency(summary.saldo)}</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 text-[11px] text-brand-200">
              <span>Desconto sobre o valor publicado</span>
              <span className="font-semibold text-white">{discount === null ? "—" : formatPercent(discount)}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-brand-300 transition-[width] duration-500" style={{ width: `${discountWidth}%` }} />
            </div>
          </div>
        </div>

        <div className="flex h-full flex-col rounded-2xl border border-line bg-white px-4 shadow-[0_1px_2px_rgba(22,35,27,0.03)]">
          {summaryMetrics.map((metric, index) => {
            const values = {
              empresas: summary.totalEmpresas,
              licitacoes: summary.totalLicitacoes,
              lotes: summary.totalLotes,
            };
            return (
              <div key={metric.key} className={index > 0 ? "flex flex-1 items-center justify-between gap-3 border-t border-line py-4" : "flex flex-1 items-center justify-between gap-3 py-4"}>
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-700">
                    <metric.icon className="size-4" strokeWidth={1.8} />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{metric.label}</span>
                </div>
                <span className="text-2xl font-semibold tabular-nums tracking-[-0.04em] text-ink">{values[metric.key]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(22,35,27,0.03)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Trophy className="size-4 text-brand-600" strokeWidth={1.8} />
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Empresa com maior valor aceito</p>
              </div>
              <p className="mt-3 line-clamp-2 text-base font-semibold leading-tight tracking-[-0.02em] text-ink" title={leaderName}>
                {leaderName}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Total aceito</p>
              <p className="mt-1 text-base font-semibold tabular-nums text-brand-700">{formatCurrency(summary.totalMaiorEmpresa)}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-50">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(0, Math.min(100, leaderShare))}%` }} />
            </div>
            <span className="shrink-0 text-[10px] font-medium tabular-nums text-muted-foreground">{formatPercent(leaderShare, 1)} do contratado</span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(22,35,27,0.03)]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Maior contrato</p>
            <ArrowUpRight className="size-4 text-brand-600" strokeWidth={1.8} />
          </div>
          <div>
            <p className="mt-3 text-xl font-semibold tabular-nums tracking-[-0.03em] text-ink">{formatCurrency(summary.maiorContrato)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Maior valor aceito individual</p>
          </div>
        </div>
      </div>
    </section>
  );
}
