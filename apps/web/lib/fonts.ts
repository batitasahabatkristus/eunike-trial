import localFont from "next/font/local";

// Self-hosted (F-14). Same families as the prototype: Baloo 2, Quicksand, Parisienne; SK theme adds Nunito and Fredoka.
export const baloo = localFont({
  src: "../app/fonts/baloo-2-latin-wght-normal.woff2",
  weight: "400 800",
  variable: "--font-baloo",
  display: "swap",
});
export const quicksand = localFont({
  src: "../app/fonts/quicksand-latin-wght-normal.woff2",
  weight: "300 700",
  variable: "--font-quicksand",
  display: "swap",
});
export const parisienne = localFont({
  src: "../app/fonts/parisienne-latin-400-normal.woff2",
  weight: "400",
  variable: "--font-parisienne",
  display: "swap",
});
export const nunito = localFont({
  src: "../app/fonts/nunito-latin-wght-normal.woff2",
  weight: "200 1000",
  variable: "--font-nunito",
  display: "swap",
});
export const fredoka = localFont({
  src: "../app/fonts/fredoka-latin-wght-normal.woff2",
  weight: "300 700",
  variable: "--font-fredoka",
  display: "swap",
});

export const fontVars = [baloo, quicksand, parisienne, nunito, fredoka].map((f) => f.variable).join(" ");
