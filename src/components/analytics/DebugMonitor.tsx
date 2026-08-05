"use client";

import { useEffect, useState } from "react";

interface LogLine {
  time: string;
  label: string;
  detail?: string;
}

const listeners = new Set<(line: LogLine) => void>();

/** Chamado de qualquer lugar do client para alimentar o monitor visível na tela. */
export function debugLog(label: string, detail?: unknown): void {
  const line: LogLine = {
    time: new Date().toLocaleTimeString("pt-BR", { hour12: false }),
    label,
    detail:
      detail === undefined
        ? undefined
        : typeof detail === "string"
          ? detail
          : JSON.stringify(detail),
  };
  // eslint-disable-next-line no-console
  console.log(`[monitor] ${line.time} ${label}`, detail ?? "");
  listeners.forEach((fn) => fn(line));
}

/**
 * Painel fixo no canto da tela, só para depuração local — mostra em tempo
 * real cliques, disparos de pixel e chamadas de API, além de capturar erros
 * globais de JS e violações de CSP que normalmente só aparecem no console.
 * Remover antes de qualquer deploy real.
 */
export function DebugMonitor() {
  const [lines, setLines] = useState<LogLine[]>([]);

  useEffect(() => {
    const onLine = (line: LogLine) =>
      setLines((prev) => [...prev.slice(-24), line]);
    listeners.add(onLine);

    const onError = (event: ErrorEvent) => {
      debugLog("ERRO JS", `${event.message} @ ${event.filename}:${event.lineno}`);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      debugLog("PROMISE REJEITADA", String(event.reason));
    };
    const onCsp = (event: SecurityPolicyViolationEvent) => {
      debugLog(
        "CSP BLOQUEOU",
        `${event.violatedDirective} — ${event.blockedURI}`,
      );
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    document.addEventListener("securitypolicyviolation", onCsp);
    debugLog("monitor montado");

    return () => {
      listeners.delete(onLine);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      document.removeEventListener("securitypolicyviolation", onCsp);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        right: 12,
        zIndex: 9999,
        width: 360,
        maxHeight: "50vh",
        overflowY: "auto",
        background: "rgba(2,6,23,0.95)",
        border: "1px solid rgba(52,211,153,0.4)",
        borderRadius: 12,
        padding: "10px 12px",
        fontFamily: "ui-monospace, monospace",
        fontSize: 11,
        color: "#e2e8f0",
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ color: "#34d399", fontWeight: 700, marginBottom: 6 }}>
        MONITOR (dev only)
      </div>
      {lines.length === 0 && (
        <div style={{ opacity: 0.6 }}>aguardando eventos…</div>
      )}
      {lines.map((line, i) => (
        <div key={i} style={{ marginBottom: 4, lineHeight: 1.4 }}>
          <span style={{ opacity: 0.5 }}>{line.time}</span>{" "}
          <span style={{ color: "#fbbf24" }}>{line.label}</span>
          {line.detail && (
            <div style={{ opacity: 0.8, wordBreak: "break-all" }}>
              {line.detail}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
