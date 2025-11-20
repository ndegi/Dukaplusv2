import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SyncManager } from "@/components/offline/sync-manager"
import { OfflineIndicator } from "@/components/offline/offline-indicator"
import { ThemeProvider } from "next-themes"
import { CurrencyProvider } from "@/lib/contexts/currency-context"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DukaPlus POS",
  description: "Modern Point of Sale System",
  generator: "dukaplus",
  icons: {
    icon: [
      { rel: "icon", url: "/favicon.png" },
      { rel: "icon", url: "/icon.ico", sizes: "any" },
    ],
    apple: "/icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#1a1a1a" />
        <meta name="description" content="DukaPlus - Modern Point of Sale System" />
      </head>
      <body className={`font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <CurrencyProvider>
            <SyncManager />
            <OfflineIndicator />
            <div suppressHydrationWarning>{children}</div>
            <Analytics />
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
