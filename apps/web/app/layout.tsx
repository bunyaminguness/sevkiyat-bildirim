import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sevkiyat Bildirim Sistemi',
  description: 'Mağaza sevkiyat sorunları takip sistemi',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  )
}
