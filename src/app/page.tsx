import { Hero } from "@/components/landing/Hero";

// Força renderização dinâmica (por requisição), não estática em build time.
// Sem isto, NEXT_PUBLIC_META_PIXEL_ID e demais env vars ficam congeladas no
// HTML gerado durante o build — trocar a env var na Vercel exige um build
// novo de verdade (não só redeploy do mesmo artefato) para refletir.
export const dynamic = "force-dynamic";

export default function LandingPage() {
  return <Hero />;
}
