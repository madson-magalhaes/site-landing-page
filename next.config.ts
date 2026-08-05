import type { NextConfig } from "next";
import path from "node:path";

/**
 * CSP restrita ao mínimo que o Pixel da Meta precisa para funcionar.
 * connect.facebook.net serve o fbevents.js; www.facebook.com recebe o beacon /tr.
 * Nada de wildcard, nada de domínio de terceiro fora desses dois — ARQ_04 §4.3.
 *
 * Em desenvolvimento o Next precisa de 'unsafe-eval' (Fast Refresh/webpack) e
 * de conectar no próprio WebSocket do HMR (ws://localhost:*) — sem isso o
 * bundle do client quebra silenciosamente e nada de JS roda na página,
 * inclusive onClick handlers. Nunca usar esta versão relaxada em produção.
 */
const isDev = process.env.NODE_ENV !== "production";

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval' " : ""}https://connect.facebook.net`,
  `connect-src 'self' https://www.facebook.com https://connect.facebook.net${isDev ? " ws://localhost:* http://localhost:*" : ""}`,
  "img-src 'self' https://www.facebook.com data:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Evita o Next inferir a raiz errada quando há outro lockfile em diretório pai.
  outputFileTracingRoot: path.join(__dirname),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
