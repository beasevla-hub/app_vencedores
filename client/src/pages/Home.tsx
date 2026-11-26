import { useAuth } from "@/_core/hooks/useAuth";
import { CompanyReportGroup } from "@/components/CompanyReportGroup";
import { OrganCombobox } from "@/components/OrganCombobox";
import { ReportOverview } from "@/components/ReportOverview";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { startLogin } from "@/const";
import { formatDateRange } from "@/lib/format";
import { downloadReportPdf } from "@/lib/pdfReport";
import { trpc } from "@/lib/trpc";
import type { ReportFilters } from "@shared/reporting";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Database,
  FileSearch,
  FileText,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

const LOGO_URL = "/thi-logo.png";

function localDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function initialDateRange(): Pick<ReportFilters, "startDate" | "endDate"> {
  const now = new Date();
  return { startDate: `${now.getFullYear()}-01-01`, endDate: localDate(now) };
}

function sameFilters(left: ReportFilters | null, right: ReportFilters) {
  return Boolean(left && left.orgao === right.orgao && left.startDate === right.startDate && left.endDate === right.endDate);
}

function ReportSkeleton() {
  return (
    <div className="mt-8 space-y-3" aria-live="polite" aria-label="Carregando relatório">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32 bg-brand-100" />
          <Skeleton className="h-7 w-64 bg-brand-100" />
          <Skeleton className="h-3 w-44 bg-brand-100" />
        </div>
        <Skeleton className="h-10 w-32 bg-brand-100" />
      </div>
      <div className="grid gap-3 lg:grid-cols-[1.45fr_1fr]">
        <Skeleton className="h-56 rounded-2xl bg-brand-100" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-56 rounded-2xl bg-brand-100" />
          <Skeleton className="h-56 rounded-2xl bg-brand-100" />
          <Skeleton className="h-56 rounded-2xl bg-brand-100" />
        </div>
      </div>
      <Skeleton className="h-28 rounded-2xl bg-brand-100" />
      <Skeleton className="h-52 rounded-2xl bg-brand-100" />
    </div>
  );
}

function LoginScreen() {
  return (
    <main className="min-h-screen bg-canvas px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between">
          <img src={LOGO_URL} alt="THI Engenharia e Arquitetura" className="h-10 w-auto object-contain" />
          <p className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:block">Captação Geral · Notion</p>
        </header>

        <div className="mt-8 grid flex-1 overflow-hidden rounded-3xl border border-line bg-white shadow-[0_30px_80px_-50px_rgba(18,58,34,0.45)] lg:grid-cols-[1.08fr_0.92fr]">
          <section className="relative overflow-hidden bg-brand-800 p-7 text-white sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -bottom-20 -left-16 size-64 rounded-full bg-white/[0.035]" />
            <div className="relative flex h-full flex-col justify-between gap-10">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-100">
                  <Sparkles className="size-3" /> Inteligência de licitações
                </span>
                <h1 className="mt-6 max-w-md text-3xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-4xl">Decisões melhores começam com dados organizados.</h1>
                <p className="mt-5 max-w-md text-sm leading-relaxed text-brand-100/90">Consolide os resultados da Captação Geral, compare valores por órgão e transforme a análise em um relatório executivo pronto para compartilhar.</p>
              </div>
              <div className="hidden gap-3 sm:grid sm:grid-cols-3">
                {[
                  { icon: Building2, label: "Órgãos e subprefeituras" },
                  { icon: FileText, label: "Relatórios em PDF" },
                  { icon: ShieldCheck, label: "Acesso restrito" },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.045] p-3">
                    <item.icon className="mt-0.5 size-4 shrink-0 text-brand-200" strokeWidth={1.7} />
                    <span className="text-[11px] leading-snug text-brand-100">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="flex items-center p-7 sm:p-10 lg:p-12">
            <div className="mx-auto w-full max-w-sm">
              <div className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                <ShieldCheck className="size-5" strokeWidth={1.8} />
              </div>
              <h2 className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-ink">Acesse o painel</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Entre com sua conta corporativa para consultar a base e gerar relatórios.</p>
              <Button onClick={() => startLogin()} className="mt-7 h-11 w-full rounded-xl bg-brand-700 text-sm font-semibold text-white hover:bg-brand-800">
                Entrar no painel <ArrowRight className="size-4" />
              </Button>
              <div className="mt-5 flex items-center gap-2 text-[11px] text-muted-foreground">
                <CheckCircle2 className="size-3.5 text-brand-600" /> Dados consultados diretamente do Notion
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  const { loading: loadingAuth, isAuthenticated } = useAuth();
  const [filters, setFilters] = useState<ReportFilters>(() => ({ orgao: "", ...initialDateRange() }));
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const trpcUtils = trpc.useUtils();
  const syncMutation = trpc.report.sync.useMutation();
  const organsQuery = trpc.report.organs.useQuery(undefined, { enabled: isAuthenticated, retry: 1 });
  const reportQuery = trpc.report.generate.useQuery(appliedFilters as ReportFilters, {
    enabled: Boolean(appliedFilters) && isAuthenticated,
  });

  const dateInvalid = Boolean(filters.startDate && filters.endDate && filters.startDate > filters.endDate);
  const canSubmit = Boolean(filters.orgao && filters.startDate && filters.endDate) && !dateInvalid && !reportQuery.isFetching;
  const filtersChanged = Boolean(appliedFilters && !sameFilters(appliedFilters, filters));
  const report = reportQuery.data;
  const reportIsUpdating = reportQuery.isFetching;

  const rangePresets = useMemo(() => {
    const now = new Date();
    const last90 = new Date(now);
    last90.setDate(last90.getDate() - 90);
    return [
      { label: "Este ano", range: { startDate: `${now.getFullYear()}-01-01`, endDate: localDate(now) } },
      { label: "Últimos 90 dias", range: { startDate: localDate(last90), endDate: localDate(now) } },
      {
        label: "Ano anterior",
        range: { startDate: `${now.getFullYear() - 1}-01-01`, endDate: `${now.getFullYear() - 1}-12-31` },
      },
    ];
  }, []);

  const runReport = (nextFilters: ReportFilters) => {
    if (!nextFilters.orgao || !nextFilters.startDate || !nextFilters.endDate || nextFilters.startDate > nextFilters.endDate) return;
    if (sameFilters(appliedFilters, nextFilters)) {
      void reportQuery.refetch();
      return;
    }
    setAppliedFilters({ ...nextFilters });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runReport(filters);
  };

  const handleSync = async () => {
    try {
      const result = await syncMutation.mutateAsync();
      await Promise.all([
        trpcUtils.report.organs.invalidate(),
        appliedFilters ? trpcUtils.report.generate.invalidate(appliedFilters) : Promise.resolve(),
      ]);
      toast.success("Base consultada com sucesso", {
        description: `${result.records} registro${result.records === 1 ? "" : "s"} encontrado${result.records === 1 ? "" : "s"} na Captação Geral.`,
      });
    } catch (error) {
      const description = error instanceof Error ? error.message : "Tente novamente em alguns instantes.";
      toast.error("Não foi possível consultar a base", { description });
    }
  };

  const handleDownload = async () => {
    if (!report) return;
    setIsDownloading(true);
    try {
      await downloadReportPdf(report);
    } catch (error) {
      const description = error instanceof Error ? error.message : "Tente novamente após recarregar a página.";
      toast.error("Não foi possível baixar o PDF", { description });
    } finally {
      setIsDownloading(false);
    }
  };

  const scrollToFilters = () => document.getElementById("filtros")?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (loadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin text-brand-600" /> Carregando painel…
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <img src={LOGO_URL} alt="THI Engenharia e Arquitetura" className="h-9 w-auto shrink-0 object-contain" />
            <div className="hidden h-7 w-px bg-line sm:block" />
            <div className="hidden min-w-0 sm:block">
              <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">THI Engenharia e Arquitetura</p>
              <p className="truncate text-[12px] font-medium text-ink">Painel de licitações</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-line bg-[#FAFCF9] px-3 py-1.5 text-[10px] font-medium text-muted-foreground md:flex">
              <span className="size-1.5 rounded-full bg-brand-500" /> Fonte Notion
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncMutation.isPending}
              className="h-9 rounded-xl border-line bg-white px-3 text-[11px] font-semibold text-ink hover:bg-brand-50"
            >
              {syncMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              <span className="hidden sm:inline">Atualizar base</span>
              <span className="sm:hidden">Atualizar</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] px-4 pb-10 pt-7 sm:px-6 sm:pt-9 lg:px-8">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-600">Captação Geral</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-ink sm:text-4xl">Relatórios de licitações</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Consolide resultados por órgão, compare valores publicados e contratados e exporte um relatório executivo em PDF.</p>
          </div>
          <div className="hidden items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-[11px] text-muted-foreground lg:flex">
            <Database className="size-4 text-brand-600" strokeWidth={1.8} />
            <span><strong className="font-semibold text-ink">Captação Geral</strong> · resultados finais</span>
          </div>
        </section>

        <section id="filtros" className="mt-6 scroll-mt-24 rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(22,35,27,0.03)] sm:p-5">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.68fr)_minmax(0,0.68fr)_auto] lg:items-end">
              <div className="grid gap-1.5">
                <Label htmlFor="orgao" className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">Órgão / Subprefeitura</Label>
                <OrganCombobox
                  organs={organsQuery.data ?? []}
                  value={filters.orgao}
                  onChange={orgao => setFilters(current => ({ ...current, orgao }))}
                  loading={organsQuery.isLoading}
                  disabled={Boolean(organsQuery.error)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="inicio" className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">Data inicial</Label>
                <Input
                  id="inicio"
                  type="date"
                  value={filters.startDate}
                  max={filters.endDate}
                  onChange={event => setFilters(current => ({ ...current, startDate: event.target.value }))}
                  className="h-11 rounded-xl border-line bg-white px-3 text-sm shadow-none focus-visible:border-brand-500 focus-visible:ring-brand-500/20"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="fim" className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">Data final</Label>
                <Input
                  id="fim"
                  type="date"
                  value={filters.endDate}
                  min={filters.startDate}
                  onChange={event => setFilters(current => ({ ...current, endDate: event.target.value }))}
                  className="h-11 rounded-xl border-line bg-white px-3 text-sm shadow-none focus-visible:border-brand-500 focus-visible:ring-brand-500/20"
                />
              </div>
              <Button
                type="submit"
                disabled={!canSubmit}
                className="h-11 rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800 disabled:bg-brand-200 disabled:text-brand-700"
              >
                {reportQuery.isFetching ? <Loader2 className="size-4 animate-spin" /> : <FileSearch className="size-4" />}
                Gerar análise
              </Button>
            </div>

            <div className="mt-3 flex flex-col gap-2 border-t border-line/80 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Períodos rápidos</span>
                {rangePresets.map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setFilters(current => ({ ...current, ...preset.range }))}
                    className="rounded-lg border border-line bg-white px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Critério: <strong className="font-semibold text-ink">Aceita e Habilitada</strong> ou <strong className="font-semibold text-ink">Perdida</strong>.
              </p>
            </div>
          </form>

          {organsQuery.error ? (
            <Alert className="mt-4 border-red-200 bg-red-50 text-red-800">
              <AlertCircle className="size-4" />
              <AlertTitle>Não foi possível carregar os órgãos</AlertTitle>
              <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span>{organsQuery.error.message}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => organsQuery.refetch()} className="h-8 w-fit border-red-200 bg-white text-[11px] text-red-800 hover:bg-red-100">
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}
          {dateInvalid ? <p className="mt-3 text-[11px] font-medium text-red-700">A data final precisa ser igual ou posterior à data inicial.</p> : null}
        </section>

        {filtersChanged ? (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>Os filtros foram alterados. O relatório exibido abaixo ainda usa o recorte anterior.</p>
            </div>
            <Button type="button" size="sm" onClick={() => runReport(filters)} disabled={!canSubmit} className="h-8 w-fit rounded-lg bg-amber-900 px-3 text-[11px] font-semibold text-white hover:bg-amber-950">
              Atualizar análise
            </Button>
          </div>
        ) : null}

        {reportQuery.error ? (
          <Alert className="mt-4 border-red-200 bg-red-50 text-red-800">
            <AlertCircle className="size-4" />
            <AlertTitle>Não foi possível gerar o relatório</AlertTitle>
            <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>{reportQuery.error.message}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => reportQuery.refetch()} className="h-8 w-fit border-red-200 bg-white text-[11px] text-red-800 hover:bg-red-100">
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {!appliedFilters && !reportQuery.error ? (
          <section className="mt-6 overflow-hidden rounded-2xl border border-dashed border-brand-200 bg-white p-6 sm:p-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                <CalendarDays className="size-5" strokeWidth={1.7} />
              </div>
              <h2 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-ink">Defina o recorte da análise</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">Escolha um órgão e um período para consultar os resultados finais da base Captação Geral.</p>
            </div>
            <div className="mx-auto mt-7 grid max-w-3xl gap-3 sm:grid-cols-3">
              {[
                { step: "01", icon: Building2, title: "Escolha o órgão", text: "Busque entre as subprefeituras e órgãos disponíveis." },
                { step: "02", icon: CalendarDays, title: "Defina o período", text: "Use as datas ou um dos períodos rápidos." },
                { step: "03", icon: FileText, title: "Gere e exporte", text: "Analise os indicadores e baixe o PDF executivo." },
              ].map(item => (
                <div key={item.step} className="rounded-xl border border-line bg-[#FAFCF9] p-4 text-left">
                  <div className="flex items-center justify-between">
                    <item.icon className="size-4 text-brand-600" strokeWidth={1.8} />
                    <span className="text-[9px] font-semibold tabular-nums text-muted-foreground">{item.step}</span>
                  </div>
                  <p className="mt-3 text-[12px] font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {reportQuery.isLoading ? <ReportSkeleton /> : null}

        {report && !reportQuery.isLoading ? (
          <>
            <section className="mt-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-600">Relatório de vencedores</p>
                    {reportIsUpdating ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">
                        <Loader2 className="size-3 animate-spin" /> Atualizando
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">
                        <CheckCircle2 className="size-3" /> Consolidado
                      </span>
                    )}
                  </div>
                  <h2 className="mt-1 break-words text-2xl font-semibold uppercase tracking-[-0.04em] text-ink sm:text-3xl">{report.filters.orgao}</h2>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {formatDateRange(report.filters.startDate, report.filters.endDate)} · {report.records.length} registro{report.records.length === 1 ? "" : "s"}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleDownload}
                  disabled={report.records.length === 0 || isDownloading || reportIsUpdating || filtersChanged}
                  className="h-11 w-fit rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800 disabled:bg-brand-200 disabled:text-brand-700"
                >
                  {isDownloading ? <Loader2 className="size-4 animate-spin" /> : <ArrowDownToLine className="size-4" />}
                  {isDownloading ? "Preparando PDF…" : "Baixar PDF"}
                </Button>
              </div>
            </section>

            {report.records.length === 0 ? (
              <section className="mt-5 grid min-h-64 place-items-center rounded-2xl border border-dashed border-brand-200 bg-white p-8 text-center">
                <div className="max-w-sm">
                  <FileSearch className="mx-auto size-9 text-brand-600" strokeWidth={1.5} />
                  <h3 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-ink">Nenhum resultado final no período</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Não encontramos licitações com status Aceita e Habilitada ou Perdida para este órgão e período.</p>
                  <Button type="button" variant="outline" onClick={scrollToFilters} className="mt-4 h-9 rounded-xl border-line bg-white text-[12px] font-semibold text-ink hover:bg-brand-50">
                    Revisar filtros
                  </Button>
                </div>
              </section>
            ) : (
              <>
                <ReportOverview report={report} />
                <section className="mt-8">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-600">Detalhamento</p>
                      <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-ink">Empresas e editais</h2>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Ordenado por valor aceito consolidado</p>
                  </div>
                  <div className="mt-4 space-y-3">
                    {report.groups.map((group, index) => (
                      <CompanyReportGroup key={`${group.empresa}-${index}`} group={group} index={index} />
                    ))}
                  </div>
                </section>
              </>
            )}
          </>
        ) : null}
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-2 px-4 py-6 text-[10px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>THI Engenharia e Arquitetura · Captação Geral</p>
          <p>Dados consultados diretamente do Notion.</p>
        </div>
      </footer>
    </div>
  );
}
