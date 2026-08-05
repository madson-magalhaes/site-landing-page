import { NextResponse } from "next/server";
import {
  MAX_BODY_BYTES,
  sanitizeFbcFbp,
  sanitizeOptionalString,
  sanitizeUserAgent,
  validateRefId,
} from "@/lib/security/validation";
import { config, isTenantConfigured } from "@/lib/config";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { ApiErrorResponse, ApiOkResponse } from "@/types/tracking";

/**
 * POST /api/pageview — chamado ao carregar a landing (ARQ_02 §2 passo 5).
 * É AQUI que a linha em core.cliques_landing nasce (via RPC
 * core.registrar_pageview_landing), com clicou_wpp_at ainda NULL — antes de
 * qualquer clique no botão de WhatsApp. Reload da página é idempotente
 * (ON CONFLICT (ref_id) DO NOTHING na função).
 *
 * Falha do Supabase NUNCA deve travar a navegação do lead — responde 200 com
 * ok:false em vez de 5xx.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return jsonError("payload excede o limite permitido", 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("corpo inválido: esperado JSON", 400);
  }

  if (typeof body !== "object" || body === null) {
    return jsonError("corpo inválido: esperado objeto JSON", 400);
  }

  const record = body as Record<string, unknown>;
  const refIdResult = validateRefId(record.ref_id);
  if (!refIdResult.ok || !refIdResult.data) {
    return jsonError(refIdResult.error ?? "ref_id inválido", 400);
  }

  if (!isTenantConfigured()) {
    console.error(
      "[api/pageview] NEXT_PUBLIC_TENANT_ID não configurado — ver .env.example",
    );
    return jsonError("tenant não configurado", 500);
  }

  const sanitized = {
    ref_id: refIdResult.data,
    landing_url: sanitizeOptionalString(record.landing_url, 2048),
    user_agent: sanitizeUserAgent(record.user_agent),
    fbc: sanitizeFbcFbp(record.fbc),
    fbp: sanitizeFbcFbp(record.fbp),
    fbclid: sanitizeOptionalString(record.fbclid),
    utm_source: sanitizeOptionalString(record.utm_source),
    utm_medium: sanitizeOptionalString(record.utm_medium),
    utm_campaign: sanitizeOptionalString(record.utm_campaign),
    utm_content: sanitizeOptionalString(record.utm_content),
    utm_term: sanitizeOptionalString(record.utm_term),
  };

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.schema("core").rpc(
      "registrar_pageview_landing",
      {
        p_tenant_id: config.tenantId,
        p_ref_id: sanitized.ref_id,
        p_fbc: sanitized.fbc,
        p_fbp: sanitized.fbp,
        p_fbclid: sanitized.fbclid,
        p_utm_source: sanitized.utm_source,
        p_utm_medium: sanitized.utm_medium,
        p_utm_campaign: sanitized.utm_campaign,
        p_utm_content: sanitized.utm_content,
        p_utm_term: sanitized.utm_term,
        p_landing_url: sanitized.landing_url,
        p_user_agent: sanitized.user_agent,
      },
    );

    if (error) {
      console.error("[api/pageview] falha ao gravar no Supabase", error.message);
      return jsonError("falha ao registrar pageview", 502);
    }
  } catch (err) {
    console.error("[api/pageview] erro inesperado", err);
    return jsonError("erro inesperado", 500);
  }

  const response: ApiOkResponse = { ok: true, ref_id: sanitized.ref_id };
  return NextResponse.json(response);
}

function jsonError(error: string, status: number): NextResponse {
  const body: ApiErrorResponse = { ok: false, error };
  return NextResponse.json(body, { status });
}
