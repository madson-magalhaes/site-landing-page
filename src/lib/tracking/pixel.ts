/**
 * Wrapper tipado sobre window.fbq. Isola o resto do código do fato de que o
 * Pixel é injetado via script externo (não existe até o next/script terminar
 * de carregar) e evita repetir a checagem de undefined em cada chamador.
 */

type FbqFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: FbqFn;
  }
}

function getFbq(): FbqFn | null {
  if (typeof window === "undefined") return null;
  return window.fbq ?? null;
}

export function trackPageView(eventId: string): void {
  const fbq = getFbq();
  if (!fbq) {
    console.warn("[pixel] fbq indisponível — PageView não disparado");
    return;
  }
  fbq("track", "PageView", {}, { eventID: eventId });
}

/**
 * Clique no botão de WhatsApp = 'Lead' no vocabulário da Meta (demonstrou
 * interesse, entrou em contato) — não 'InitiateCheckout'. Esse nome fica
 * reservado para o marco seguinte do funil (orçamento pronto, disparado
 * server-side em core.aplicar_etapa_e_liberar()), evitando o mesmo
 * event_name aparecer em dois pontos distintos do funil sem event_id
 * compartilhado — o que a Meta contaria como dois eventos, não um reforçado.
 */
export function trackLead(eventId: string): void {
  const fbq = getFbq();
  if (!fbq) {
    console.warn("[pixel] fbq indisponível — Lead não disparado");
    return;
  }
  fbq("track", "Lead", {}, { eventID: eventId });
}
