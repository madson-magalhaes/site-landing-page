/**
 * Validação de entrada para os stubs de API. Assume entrada hostil por
 * princípio (ARQ_04 §4.1) mesmo sem backend real ainda — allowlist, nunca
 * blacklist (README, princípio 5).
 */

import { isValidRefId } from "@/lib/tracking/refId";

export const MAX_BODY_BYTES = 8 * 1024; // 8 KB — ARQ_04 §4.1
const MAX_USER_AGENT_LENGTH = 512;
const FBC_FBP_PATTERN = /^fb\.\d\.\d+\.[A-Za-z0-9_-]+$/;

export interface ValidationResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export function validateRefId(value: unknown): ValidationResult<string> {
  if (typeof value !== "string" || !isValidRefId(value)) {
    return { ok: false, error: "ref_id inválido ou ausente" };
  }
  return { ok: true, data: value };
}

/** fbc/fbp fora do formato são descartados (campo vira null), não rejeitam a requisição — ARQ_04 §4.1 */
export function sanitizeFbcFbp(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return FBC_FBP_PATTERN.test(value) ? value : null;
}

export function sanitizeUserAgent(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.slice(0, MAX_USER_AGENT_LENGTH);
}

export function sanitizeOptionalString(
  value: unknown,
  maxLength = 256,
): string | null {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  return value.slice(0, maxLength);
}
