"use client";

import { useState } from "react";
import { config, isWhatsAppConfigured } from "@/lib/config";
import { getOrCreateRefId } from "@/components/analytics/MetaPixel";
import { buildEventId } from "@/lib/tracking/eventId";
import { trackLead } from "@/lib/tracking/pixel";
import { Button } from "@/components/ui/button";
import { debugLog } from "@/components/analytics/DebugMonitor";
import type { CliqueWppPayload } from "@/types/tracking";

async function registrarClique(payload: CliqueWppPayload): Promise<void> {
  try {
    const res = await fetch("/api/clique", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    debugLog("POST /api/clique", `status ${res.status}`);
  } catch (err) {
    debugLog("POST /api/clique FALHOU", String(err));
    console.warn("[clique] falha ao registrar", err);
  }
}

/**
 * O ref_id é deliberadamente OMITIDO do texto — um código tipo '#LP4OT9LQB'
 * na mensagem pré-preenchida assusta lead leigo (parece spam/golpe). O
 * casamento clique↔conversa passa a depender só do fallback temporal
 * (ARQ_02 §4 camada 2): quando a mensagem chegar no n8n, busca o clique mais
 * recente sem session_id deste tenant dentro da janela de alguns minutos.
 * Se houver 2+ cliques na mesma janela, não casa (não-atribuição é melhor
 * que atribuição errada) — é assim que a doc já previa lidar com esse caso,
 * então isso não é uma perda de cobertura, é usar a camada 2 como principal.
 */
function buildWhatsAppUrl(): string {
  return `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(config.whatsappMessage)}`;
}

export function WhatsAppButton() {
  const [redirecting, setRedirecting] = useState(false);

  async function handleClick() {
    debugLog("clique no botão WhatsApp");
    if (redirecting) return;
    setRedirecting(true);

    const refId = getOrCreateRefId();
    const eventId = buildEventId(refId, "clicou_wpp");
    debugLog("ref_id/event_id", `${refId} / ${eventId}`);

    trackLead(eventId);
    debugLog(
      "fbq Lead",
      typeof window !== "undefined" && window.fbq ? "fbq presente" : "fbq AUSENTE",
    );

    // fbc/fbp podem ter aparecido só depois do pageview inicial (o cookie do
    // pixel às vezes leva um instante para ser gravado) — reenviar aqui deixa
    // registrar_clique_wpp_landing() atualizar via COALESCE se for o caso.
    const payload: CliqueWppPayload = {
      ref_id: refId,
      fbc: readCookie("_fbc"),
      fbp: readCookie("_fbp"),
    };

    // ARQ_02 §7: nunca navegar antes do POST completar (sucesso ou erro).
    await registrarClique(payload).finally(() => {
      if (!isWhatsAppConfigured()) {
        debugLog("redirect ABORTADO", "NEXT_PUBLIC_WHATSAPP_NUMBER vazio");
        setRedirecting(false);
        return;
      }
      const url = buildWhatsAppUrl();
      debugLog("redirecionando para", url);
      window.location.href = url;
    });
  }

  return (
    <Button
      type="button"
      size="lg"
      className="w-full sm:w-auto"
      onClick={handleClick}
      disabled={redirecting}
    >
      <WhatsAppIcon />
      {redirecting ? "Te levando para o WhatsApp…" : "Falar no WhatsApp"}
    </Button>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.1c-.24.68-1.4 1.3-1.93 1.37-.5.07-1.03.32-3.44-.72-2.9-1.25-4.78-4.2-4.93-4.4-.14-.19-1.18-1.57-1.18-3 0-1.43.75-2.13 1.02-2.42.27-.29.58-.36.78-.36.2 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.82 2 .89 2.15.07.15.12.32.02.51-.1.19-.15.31-.3.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.35 1.46.29.15.46.13.63-.08.17-.2.72-.84.91-1.13.19-.29.38-.24.64-.14.26.1 1.66.78 1.94.92.29.15.48.22.55.34.07.13.07.73-.17 1.41Z" />
    </svg>
  );
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name}=([^;]*)`),
  );
  const value = match?.[1];
  return value ? decodeURIComponent(value) : null;
}
