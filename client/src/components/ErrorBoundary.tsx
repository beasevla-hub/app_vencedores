import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center bg-canvas px-4 py-8">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-white p-8 shadow-[0_24px_70px_-55px_rgba(18,58,34,0.55)]">
            <img src="/thi-logo.png" alt="THI Engenharia e Arquitetura" className="h-10 w-auto object-contain" />
            <div className="mt-8 grid size-12 place-items-center rounded-2xl bg-red-50 text-red-700">
              <AlertTriangle className="size-5" strokeWidth={1.7} />
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-ink">Algo deu errado</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Não foi possível renderizar esta página. Recarregue para tentar novamente.</p>
            {this.state.error?.message ? (
              <details className="mt-5 rounded-xl border border-line bg-[#FAFCF9] p-3 text-left">
                <summary className="cursor-pointer text-[11px] font-semibold text-muted-foreground">Detalhes do erro</summary>
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-[10px] leading-relaxed text-muted-foreground">{this.state.error.stack ?? this.state.error.message}</pre>
              </details>
            ) : null}
            <button
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
            >
              <RotateCcw className="size-4" /> Recarregar página
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
