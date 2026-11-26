import { Button } from "@/components/ui/button";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-[0_24px_70px_-55px_rgba(18,58,34,0.55)]">
        <img src="/thi-logo.png" alt="THI Engenharia e Arquitetura" className="mx-auto h-10 w-auto object-contain" />
        <div className="mx-auto mt-8 grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
          <FileQuestion className="size-5" strokeWidth={1.7} />
        </div>
        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-600">Erro 404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">Página não encontrada</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">O endereço acessado não existe ou foi movido. Volte ao painel para continuar a análise.</p>
        <Button onClick={() => setLocation("/")} className="mt-6 h-10 rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800">
          <ArrowLeft className="size-4" /> Voltar ao painel
        </Button>
      </div>
    </main>
  );
}
