/**
 * event_id compartilhado entre o fbq() do browser e o futuro envio server-side
 * (Conversions API). A Meta deduplica automaticamente quando os dois eventos
 * chegam com o mesmo event_id — ARQ_02 §1.
 *
 * Convenção: '<ref_id>_<etapa>' — igual à de core.registrar_evento_landing
 * (patch_v5_agente.sql §10), para já nascer compatível quando o backend ligar.
 */

export function buildEventId(refId: string, etapa: string): string {
  return `${refId}_${etapa}`;
}
