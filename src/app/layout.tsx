import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import { DebugMonitor } from "@/components/analytics/DebugMonitor";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Landing page teste",
  description: "Página de teste de rastreamento com o Pixel da Meta.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#020617",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={geistSans.variable}>
      <body className="font-sans antialiased">
        <MetaPixel />
        {children}
        {process.env.NODE_ENV !== "production" && <DebugMonitor />}
      </body>
    </html>
  );
}
