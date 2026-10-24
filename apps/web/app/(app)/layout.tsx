import type { Metadata } from "next";
import "../globals.css";
import "./app.css";
import { fontVars } from "@/lib/fonts";

export const metadata: Metadata = {
  title: { default: "Eunike", template: "%s · Eunike" },
  robots: { index: false, follow: false },
};

export default function AppRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={fontVars} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
