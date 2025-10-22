import type React from "react"
import type { Metadata } from "next"
import ClientLayout from "./ClientLayout"
import ServiceWorkerProvider from "@/components/ServiceWorkerProvider"

import "./globals.css"

export const metadata: Metadata = {
  title: "Izakaya Tori Ichizu Restaurant - Authentic Japanese Cuisine",
  description:
    "Experience authentic Japanese flavors at Izakaya Tori Ichizu Restaurant. Traditional dishes with a modern twist, made with the finest ingredients.",
  manifest: "/manifest.json",

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Izakaya Tori Ichizu",
  },
  icons: {
    apple: "/icon512_rounded.png",
    icon: "/icon512_rounded.png",
  },
}

export const viewport = {
  themeColor: "#3d5a3d",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head></head>
      <body>
        <ServiceWorkerProvider />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
