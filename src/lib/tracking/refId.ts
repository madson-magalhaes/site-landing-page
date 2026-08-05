/**
 * Gera o ref_id que viaja no texto pré-preenchido do WhatsApp e depois é
 * casado pelo n8n com core.cliques_landing (ARQ_02 §3.2 e §4 camada 1).
 *
 * Formato: 'LP' + epoch em base36 maiúsculo + 3 chars aleatórios.
 * Critérios (ARQ_02 §3.2): curto, maiúsculo, sem _ * ~ ` (o WhatsApp formata
 * esses caracteres como itálico/negrito), regex-safe, prefixo por tenant.
 */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomChars(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export function generateRefId(prefix = "LP"): string {
  const epochBase36 = Date.now().toString(36).toUpperCase();
  return `${prefix}${epochBase36}${randomChars(3)}`;
}

const REF_ID_PATTERN = /^[A-Z]{2}[A-Z0-9]{6,14}$/;

export function isValidRefId(value: string): boolean {
  return REF_ID_PATTERN.test(value);
}
