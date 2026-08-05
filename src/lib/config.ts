/**
 * Config pública do tenant. Nesta etapa é lida de env vars locais; quando o
 * Supabase entrar, isto vira um fetch em core.tenants (ARQ_02 §5,
 * GET /api/tenant/:id) — nunca retornando token CAPI, só o que já é público
 * no HTML de qualquer forma (ARQ_04 §3.2).
 */

export const config = {
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  whatsappMessage:
    process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE ?? "Quero saber mais",
  // core.tenants.id do Supabase (novo_formato/schema.sql). Cada deploy da
  // landing serve 1 cliente — este valor amarra os dois lados por convenção
  // manual no onboarding (ver README "Onboarding de cliente novo").
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID ?? "",
} as const;

export function isPixelConfigured(): boolean {
  return config.metaPixelId.trim().length > 0;
}

export function isWhatsAppConfigured(): boolean {
  return config.whatsappNumber.trim().length > 0;
}

export function isTenantConfigured(): boolean {
  return config.tenantId.trim().length > 0;
}
