import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase server-side, com a service_role key. NUNCA importar este
 * módulo de um client component — o pacote "server-only" faz o build falhar
 * se isso acontecer por engano.
 *
 * A service_role ignora RLS por padrão, então mesmo com esta chave o código
 * que a usa deve continuar restrito ao mínimo necessário (só as funções/
 * tabelas que a landing precisa tocar) — a proteção real aqui é a chave
 * nunca sair do server (ARQ_04 §3.2: a landing nunca deve expor token nenhum
 * ao client, só o Pixel ID, que já é público por natureza).
 */
let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configurados. Ver .env.example.",
    );
  }

  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
