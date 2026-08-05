import { WhatsAppButton } from "@/components/landing/WhatsAppButton";

export function Hero() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-slate-950 px-4 py-16 sm:px-6">
      {/* glow decorativo — puramente estético, sem dependência externa */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-6 text-center shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-10">
        <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium tracking-wide text-emerald-300 sm:text-sm">
          Teste de rastreamento
        </span>

        <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
          Landing page teste
        </h1>

        <p className="mt-4 text-balance text-sm leading-relaxed text-slate-300 sm:text-base">
          Página de validação do Pixel da Meta — dispara{" "}
          <span className="font-semibold text-white">PageView</span> ao
          carregar e{" "}
          <span className="font-semibold text-white">Lead</span>{" "}
          ao clicar no botão abaixo.
        </p>

        <div className="mt-8 flex justify-center">
          <WhatsAppButton />
        </div>
      </section>
    </main>
  );
}
