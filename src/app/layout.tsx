import type { Metadata } from "next";
import { VT323 } from "next/font/google";
import "./globals.css";

// VT323 is not a variable font, so `weight` is required (its font-data manifest
// declares exactly one weight, "400"). `display: 'optional'` (NOT 'swap', which
// defaults if omitted) is what actually satisfies "no flash of fallback font" —
// 'swap' is defined to show the fallback and then visibly swap in the real font.
const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  display: "optional",
  variable: "--font-terminal",
});

export const metadata: Metadata = {
  title: "Space Dashboard — Asteroides + Clima Espacial",
  description:
    "Terminal-styled dashboard for NASA NeoWs asteroid data and DONKI space weather.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={vt323.variable}>
      <body>{children}</body>
    </html>
  );
}
