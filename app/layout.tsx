import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SyncManager } from "@/components/offline/sync-manager"
import { OfflineIndicator } from "@/components/offline/offline-indicator"
import { ThemeProvider } from "next-themes"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DukaPlus POS",
  description: "Modern Point of Sale System",
  generator: "v0.app",
  icons: {
    icon: "/favicon.png",
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
      <body className={`font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <SyncManager />
          <OfflineIndicator />
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
