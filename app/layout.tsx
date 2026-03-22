import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Geval Config Generator | Release Enforcement for AI",
  description: "Generate Geval contract.yaml and policy YAML from a form — deploy anywhere (e.g. Vercel).",
  icons: {
    icon: "/white_bg_greenlogo.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="antialiased">
        <div className="noise" />
        <div className="dot-grid fixed inset-0 z-[-1]" />
        {children}
      </body>
    </html>
  )
}
