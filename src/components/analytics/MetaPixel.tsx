"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { config, isPixelConfigured } from "@/lib/config";
import { generateRefId } from "@/lib/tracking/refId";
import { buildEventId } from "@/lib/tracking/eventId";
import { trackPageView } from "@/lib/tracking/pixel";
import type { PageviewPayload } from "@/types/tracking";

const REF_ID_STORAGE_KEY = "lp_ref_id";

/**
 * Garante um único ref_id por sessão de navegador (sessionStorage), para que
 * PageView e Lead da mesma visita usem o mesmo identificador —
 * é isso que permite reconstruir a jornada depois (ARQ_02 §8).
 */
export function getOrCreateRefId(): string {
  if (typeof window === "undefined") return generateRefId();
  const existing = window.sessionStorage.getItem(REF_ID_STORAGE_KEY);
  if (existing) return existing;
  const fresh = generateRefId();
  window.sessionStorage.setItem(REF_ID_STORAGE_KEY, fresh);
  return fresh;
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  const value = match?.[1];
  return value ? decodeURIComponent(value) : null;
}

/**
 * O <Script afterInteractive> que carrega fbevents.js (e cria o cookie _fbc
 * a partir do fbclid da URL) roda de forma assíncrona, sem sincronia com
 * este useEffect — na prática o cookie muitas vezes ainda não existe quando
 * lemos, mesmo com fbclid presente na URL (confirmado em teste real: clique
 * de anúncio real gerou fbclid mas fbc chegou NULL no banco). Constrói o
 * mesmo formato que o Pixel usaria (fb.1.<epoch_ms>.<fbclid>, documentado
 * pela Meta) como fallback — nunca perde o dado por timing de script externo.
 */
function resolveFbc(fbclid: string | null): string | null {
  const existing = readCookie("_fbc");
  if (existing) return existing;
  if (!fbclid) return null;
  return `fb.1.${Date.now()}.${fbclid}`;
}

/** É aqui que a linha em core.cliques_landing NASCE — ver /api/pageview. */
async function registrarPageview(payload: PageviewPayload): Promise<void> {
  try {
    await fetch("/api/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (err) {
    console.warn("[pageview] falha ao registrar", err);
  }
}

export function MetaPixel() {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    if (!isPixelConfigured()) {
      console.warn(
        "[pixel] NEXT_PUBLIC_META_PIXEL_ID não configurado — PageView não será disparado. " +
          "Ver .env.example.",
      );
      return;
    }
    firedRef.current = true;

    const refId = getOrCreateRefId();
    const eventId = buildEventId(refId, "pageview");
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get("fbclid");

    trackPageView(eventId);
    void registrarPageview({
      ref_id: refId,
      landing_url: window.location.href,
      user_agent: navigator.userAgent,
      fbc: resolveFbc(fbclid),
      fbp: readCookie("_fbp"),
      fbclid,
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      utm_content: params.get("utm_content"),
      utm_term: params.get("utm_term"),
    });
  }, []);

  if (!isPixelConfigured()) return null;

  return (
    <>
      <Script id="meta-pixel-base" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${config.metaPixelId}');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${config.metaPixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
