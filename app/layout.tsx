import type { Metadata } from "next"
import { Barlow_Condensed, Barlow } from "next/font/google"
import "./globals.css"

// Barlow Condensed — impactante, deportiva, como números de camiseta
const barlowCondensed = Barlow_Condensed({
  weight: ["400", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
  subsets: ["latin"],
})

// Barlow — geométrica, legible, técnica
const barlow = Barlow({
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Picks MX — Mundial 2026",
  description: "Pronostica los partidos del Mundial 2026 y compite con tus amigos",
  icons: {
    icon: "/favicon.ico",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${barlowCondensed.variable} ${barlow.variable}`}>
      <body>{children}</body>
    </html>
  )
}
