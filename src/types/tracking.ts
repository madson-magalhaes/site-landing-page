/**
 * Contratos compartilhados entre client e as rotas de API. Espelha
 * core.cliques_landing (novo_formato/schema.sql) — a linha nasce no
 * pageview (POST /api/pageview) e é atualizada no clique do botão
 * (POST /api/clique), nessa ordem: ver core.registrar_pageview_landing /
 * core.registrar_clique_wpp_landing.
 */

export interface PageviewPayload {
  ref_id: string;
  landing_url: string;
  user_agent: string;
  fbc: string | null;
  fbp: string | null;
  fbclid: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  utm_id: string | null;
}

export interface CliqueWppPayload {
  ref_id: string;
  fbc: string | null;
  fbp: string | null;
}

export interface ApiOkResponse {
  ok: true;
  ref_id: string;
}

export interface ApiErrorResponse {
  ok: false;
  error: string;
}
