import { NextResponse } from "next/server";
import {
  MAX_BODY_BYTES,
  sanitizeFbcFbp,
  validateRefId,
} from "@/lib/security/validation";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { ApiErrorResponse, ApiOkResponse } from "@/types/tracking";

/**
 * POST /api/clique — chamado quando o lead clica no botão de WhatsApp.
 * A linha em core.cliques_landing já existe (criada em POST /api/pageview);
 * aqui só marcamos clicou_wpp_at via RPC core.registrar_clique_wpp_landing —
 * é esse timestamp que a Camada 2 do matching (fallback temporal, ARQ_02 §4)
 * usa no n8n para casar o clique com a conversa.
 *
 * Falha do Supabase NUNCA deve travar o redirect do lead para o WhatsApp —
 * por isso responde 200 com ok:false em vez de 5xx; o WhatsAppButton trata
 * isso via .finally() e segue o redirect de qualquer forma.
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

  const fbc = sanitizeFbcFbp(record.fbc);
  const fbp = sanitizeFbcFbp(record.fbp);

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.schema("core").rpc(
      "registrar_clique_wpp_landing",
      { p_ref_id: refIdResult.data, p_fbc: fbc, p_fbp: fbp },
    );

    if (error) {
      console.error("[api/clique] falha ao gravar no Supabase", error.message);
      return jsonError("falha ao registrar clique", 502);
    }
  } catch (err) {
    console.error("[api/clique] erro inesperado", err);
    return jsonError("erro inesperado", 500);
  }

  const response: ApiOkResponse = { ok: true, ref_id: refIdResult.data };
  return NextResponse.json(response);
}

function jsonError(error: string, status: number): NextResponse {
  const body: ApiErrorResponse = { ok: false, error };
  return NextResponse.json(body, { status });
}
