import { calculateDiscount, type CompanyGroup } from "@shared/reporting";

function formatCurrency(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDiscount(published: number | null, accepted: number | null): string {
  const value = calculateDiscount(published, accepted);
  return value === null ? "—" : `${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}%`;
}

export function CompanyReportGroup({ group }: { group: CompanyGroup }) {
  return (
    <section className="overflow-hidden rounded-sm border border-[#B6D9BC] bg-white">
      <div className="flex flex-col gap-2 border-b border-[#B6D9BC] bg-[#F7FBF7] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-tight text-[#193D25]">{group.empresa}</h3>
          <p className="mt-0.5 text-xs text-[#718076]">{group.licitacoes.length} licitação(ões)</p>
        </div>
        <p className="text-base font-bold text-[#174C2B]">{formatCurrency(group.totalAceito)}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[#C8E1CD] bg-white text-[10px] uppercase tracking-[0.12em] text-[#58705D]">
              <th className="px-5 py-2.5 font-bold">Licitação</th>
              <th className="w-36 px-4 py-2.5 text-right font-bold">Valor edital</th>
              <th className="w-36 px-4 py-2.5 text-right font-bold">Valor aceito</th>
              <th className="w-26 px-4 py-2.5 text-right font-bold">Desconto -%</th>
            </tr>
          </thead>
          <tbody>
            {group.licitacoes.map(licitacao => (
              <tr key={licitacao.id} className="border-b border-[#E1EEE3] last:border-0">
                <td className="px-5 py-3 align-top">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-sm font-bold text-[#1B4329]">{licitacao.edital || "Edital não informado"}</span>
                    {licitacao.processo ? <span className="text-[11px] text-[#7B877E]">Processo: {licitacao.processo}</span> : null}
                  </div>
                  <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-[#3E4D42]">{licitacao.objeto || "Objeto não informado."}</p>
                </td>
                <td className="px-4 py-3 text-right align-top text-sm font-medium text-[#25382B]">{formatCurrency(licitacao.valorPublicado)}</td>
                <td className="px-4 py-3 text-right align-top text-sm font-bold text-[#174C2B]">{formatCurrency(licitacao.valorAceito)}</td>
                <td className="px-4 py-3 text-right align-top text-sm font-bold text-[#174C2B]">{formatDiscount(licitacao.valorPublicado, licitacao.valorAceito)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
