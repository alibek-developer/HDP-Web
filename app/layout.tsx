import type { Metadata, Viewport } from 'next'
import { Geist, Inter, Manrope, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
})

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-manrope',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jet',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'HDP Academy — Admin panel',
  description: 'HDP Academy matematika ilovasi uchun boshqaruv paneli',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#16a34a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={`${inter.variable} ${manrope.variable} ${jetbrains.variable} ${geist.variable}`}>
      <body>{children}</body>
    </html>
  )
}
