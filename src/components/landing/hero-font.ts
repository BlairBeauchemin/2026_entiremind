import { Inter } from "next/font/google";

/**
 * Inter, scoped to the hero visual: the phones set their message text in it
 * (closest to the system face in Messages). Loaded here rather than in the
 * root layout so the rest of the site's type stays Karla and Prata.
 */
export const heroInter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});
