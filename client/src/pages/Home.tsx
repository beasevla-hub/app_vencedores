import { useAuth } from "@/_core/hooks/useAuth";
import { CompanyReportGroup } from "@/components/CompanyReportGroup";
import { SummaryCard } from "@/components/SummaryCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startLogin } from "@/const";
import { downloadReportPdf } from "@/lib/pdfReport";
import { trpc } from "@/lib/trpc";
import type { ReportFilters } from "@shared/reporting";
import { AlertCircle, ArrowDownToLine, Building2, CalendarDays, CircleDollarSign, FileSearch, FileText, HandCoins, Landmark, Loader2, Trophy, Users } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const LOGO_URL = "/manus-storage/thi-engenharia-positivo_4f57432d.png";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function initialDateRange(): Pick<ReportFilters, "startDate" | "endDate"> {
  const now = new Date();
  return { startDate: `${now.getFullYear()}-01-01`, endDate: now.toISOString().slice(0, 10) };
}

function formattedDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

export default function Home() {
  const { loading: loadingAuth, isAuthenticated } = useAuth();
  const defaultRange = useMemo(initialDateRange, []);
  const [filters, setFilters] = useState<ReportFilters>({ orgao: "", ...defaultRange });
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const organsQuery = trpc.report.organs.useQuery(undefined, { enabled: isAuthenticated });
  const reportQuery = trpc.report.generate.useQuery(appliedFilters as ReportFilters, { enabled: Boolean(appliedFilters) && isAuthenticated });

  useEffect(() => {
    if (!filters.orgao && organsQuery.data?.[0]) {
      setFilters(current => ({ ...current, orgao: organsQuery.data?.[0] ?? "" }));
    }
  }, [filters.orgao, organsQuery.data]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (filters.orgao && filters.startDate && filters.endDate && filters.startDate <= filters.endDate) {
      setAppliedFilters({ ...filters });
    }
  };

  const handleDownload = async () => {
    if (!reportQuery.data) return;
    setIsDownloading(true);
    try {
      await downloadReportPdf(reportQuery.data);
    } catch (error) {
      const description = error instanceof Error ? error.message : "Tente novamente após recarregar a página.";
      toast.error("Não foi possível baixar o PDF", { description });
    } finally {
      setIsDownloading(false);
    }
  };

  if (loadingAuth) {
    return <div className="flex min-h-screen items-center justify-center bg-[#F7FAF7]"><Loader2 className="h-7 w-7 animate-spin text-[#52A660]" /></div>;
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#F7FAF7] px-6 py-10 text-[#173C25] sm:px-10">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col justify-between rounded-sm border border-[#D6E7D9] bg-white p-7 shadow-[0_24px_80px_rgba(35,76,43,0.08)] sm:p-12">
          <div className="flex items-start justify-between gap-6">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#52A660]">THI Engenharia e Arquitetura</p>
              <h1 className="mt-6 text-4xl font-bold tracking-[-0.04em] text-[#174C2B] sm:text-6xl">Relatórios de vencedores.</h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-[#607065]">Acesse o painel seguro para consolidar licitações por órgão, acompanhar a economia contratada e gerar relatórios executivos em PDF.</p>
              <Button onClick={() => startLogin()} className="mt-9 bg-[#174C2B] px-6 text-white hover:bg-[#123B22]">Acessar painel</Button>
            </div>
            <img src={LOGO_URL} alt="THI Engenharia e Arquitetura" className="h-auto w-24 object-contain sm:w-36" />
          </div>
          <p className="mt-12 text-xs uppercase tracking-[0.13em] text-[#8C998F]">Captação Geral · Dados sincronizados diretamente do Notion</p>
        </div>
      </main>
    );
  }

  const report = reportQuery.data;

  return (
    <main className="min-h-screen bg-[#F7FAF7] text-[#173C25]">
      <header className="border-b border-[#DCEBDD] bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-5 px-5 py-4 sm:px-8 lg:px-12">
          <div className="flex items-center gap-4">
            <div className="h-10 w-1 bg-[#52A660]" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5D7863]">THI Engenharia e Arquitetura</p>
              <h1 className="mt-0.5 text-lg font-bold tracking-[-0.03em] text-[#174C2B] sm:text-xl">Painel de Análise de Licitações</h1>
            </div>
          </div>
          <img src={LOGO_URL} alt="THI Engenharia e Arquitetura" className="h-auto w-18 object-contain sm:w-25" />
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 sm:py-10 lg:px-12">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_270px] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#52A660]">Captação Geral</p>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.045em] text-[#173C25] sm:text-4xl">Resumo por órgão e período</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#68776B]">Analise o volume de licitações, valores publicados, valores contratados e economia gerada a partir dos resultados finais registrados no Notion.</p>
          </div>
          <div className="rounded-sm border border-[#CFE2D1] bg-[#EFF8F0] px-4 py-3 text-sm text-[#31573B]"><span className="font-bold">Critério aplicado:</span> status <strong>Aceita e Habilitada</strong> ou <strong>Perdida</strong>.</div>
        </section>

        <section className="mt-7 border-y border-[#D9E8DB] bg-white px-5 py-5 sm:px-6">
          <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[minmax(260px,1fr)_180px_180px_auto] lg:items-end">
            <div className="grid gap-2">
              <Label htmlFor="orgao" className="text-xs font-bold uppercase tracking-[0.12em] text-[#56705C]">Órgão / Subprefeitura</Label>
              <Select value={filters.orgao} onValueChange={orgao => setFilters(current => ({ ...current, orgao }))} disabled={organsQuery.isLoading || Boolean(organsQuery.error)}>
                <SelectTrigger id="orgao" className="h-11 rounded-sm border-[#C8DEC9] bg-white text-[#193D25]"><SelectValue placeholder={organsQuery.isLoading ? "Carregando órgãos…" : "Selecione um órgão"} /></SelectTrigger>
                <SelectContent>{organsQuery.data?.map(orgao => <SelectItem key={orgao} value={orgao}>{orgao}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label htmlFor="inicio" className="text-xs font-bold uppercase tracking-[0.12em] text-[#56705C]">Data inicial</Label><Input id="inicio" type="date" value={filters.startDate} onChange={event => setFilters(current => ({ ...current, startDate: event.target.value }))} className="h-11 rounded-sm border-[#C8DEC9] bg-white" /></div>
            <div className="grid gap-2"><Label htmlFor="fim" className="text-xs font-bold uppercase tracking-[0.12em] text-[#56705C]">Data final</Label><Input id="fim" type="date" value={filters.endDate} min={filters.startDate} onChange={event => setFilters(current => ({ ...current, endDate: event.target.value }))} className="h-11 rounded-sm border-[#C8DEC9] bg-white" /></div>
            <Button type="submit" disabled={!filters.orgao || !filters.startDate || !filters.endDate || filters.startDate > filters.endDate || reportQuery.isFetching} className="h-11 rounded-sm bg-[#174C2B] px-5 font-bold text-white hover:bg-[#123B22]">{reportQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}Gerar análise</Button>
          </form>
          {organsQuery.error ? <Alert className="mt-4 border-red-200 bg-red-50 text-red-800"><AlertCircle className="h-4 w-4" /><AlertTitle>Não foi possível carregar os órgãos</AlertTitle><AlertDescription>{organsQuery.error.message}</AlertDescription></Alert> : null}
          {filters.startDate > filters.endDate ? <p className="mt-3 text-xs font-medium text-red-700">A data final precisa ser igual ou posterior à data inicial.</p> : null}
        </section>

        {reportQuery.error ? <Alert className="mt-7 border-red-200 bg-red-50 text-red-800"><AlertCircle className="h-4 w-4" /><AlertTitle>Não foi possível gerar o relatório</AlertTitle><AlertDescription>{reportQuery.error.message}</AlertDescription></Alert> : null}
        {!appliedFilters && !reportQuery.error ? <section className="mt-7 grid min-h-72 place-items-center border border-dashed border-[#CFE2D1] bg-white p-8 text-center"><div className="max-w-sm"><CalendarDays className="mx-auto h-9 w-9 text-[#52A660]" strokeWidth={1.5} /><h3 className="mt-4 text-lg font-bold text-[#174C2B]">Defina o recorte da análise</h3><p className="mt-2 text-sm leading-relaxed text-[#758078]">Escolha um órgão e um período para consultar os resultados consolidados da base Captação Geral.</p></div></section> : null}
        {reportQuery.isLoading ? <section className="mt-7 grid min-h-72 place-items-center bg-white"><div className="text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-[#52A660]" /><p className="mt-3 text-sm text-[#66756A]">Consolidando licitações do Notion…</p></div></section> : null}

        {report && !reportQuery.isLoading ? (
          <>
            <section className="mt-8 flex flex-col gap-4 border-b border-[#DDE9DE] pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#65816A]">Relatório selecionado</p><h2 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[#174C2B]">{report.filters.orgao}</h2><p className="mt-1 text-sm text-[#718076]">{formattedDate(report.filters.startDate)} até {formattedDate(report.filters.endDate)}</p></div>
              <Button onClick={handleDownload} disabled={report.records.length === 0 || isDownloading} className="h-11 rounded-sm bg-[#52A660] px-5 font-bold text-white hover:bg-[#438B50]">{isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}Baixar PDF</Button>
            </section>
            <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              <SummaryCard icon={Users} label="Empresas" value={String(report.summary.totalEmpresas)} />
              <SummaryCard icon={FileText} label="Licitações" value={String(report.summary.totalLicitacoes)} />
              <SummaryCard icon={Trophy} label="Empresa c/ maior valor aceito" value={report.summary.empresaMaiorValorAceito ?? "—"} supporting={formatCurrency(report.summary.totalMaiorEmpresa)} emphasized />
              <SummaryCard icon={Landmark} label="Maior contrato" value={formatCurrency(report.summary.maiorContrato)} />
              <SummaryCard icon={Building2} label="Valor publicado" value={formatCurrency(report.summary.valorPublicado)} />
              <SummaryCard icon={CircleDollarSign} label="Valor contratado" value={formatCurrency(report.summary.valorContratado)} />
              <SummaryCard icon={HandCoins} label="Saldo / economia" value={formatCurrency(report.summary.saldo)} />
            </section>
            {report.records.length === 0 ? <section className="mt-7 grid min-h-64 place-items-center border border-dashed border-[#CFE2D1] bg-white p-8 text-center"><div className="max-w-sm"><FileSearch className="mx-auto h-9 w-9 text-[#52A660]" strokeWidth={1.5} /><h3 className="mt-4 text-lg font-bold text-[#174C2B]">Nenhum resultado final no período</h3><p className="mt-2 text-sm leading-relaxed text-[#758078]">Não foram encontradas licitações com status Aceita e Habilitada ou Perdida para os filtros selecionados.</p></div></section> : <section className="mt-8"><div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#65816A]">Detalhamento</p><h2 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[#174C2B]">Empresas vencedoras e editais</h2></div><p className="hidden text-xs text-[#758078] sm:block">Ordenado por valor aceito consolidado</p></div><div className="space-y-5">{report.groups.map(group => <CompanyReportGroup key={group.empresa} group={group} />)}</div></section>}
          </>
        ) : null}
      </div>
    </main>
  );
}
