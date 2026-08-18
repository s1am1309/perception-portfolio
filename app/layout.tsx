// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'PERCEPTION | Siam\'s Portfolio',
    template: '%s | PERCEPTION',
  },
  description: 'An immersive 3D portfolio built with Next.js, Three.js, and React Three Fiber',
  keywords: ['portfolio', '3D', 'Next.js', 'Three.js', 'Siam', 'developer', 'GitHub', 'Vercel'],
  authors: [{ name: 'Siam' }],
  creator: 'Siam',
  publisher: 'Vercel',
  openGraph: {
    title: 'PERCEPTION | Siam\'s Portfolio',
    description: 'An immersive 3D portfolio built with Next.js and Three.js',
    url: 'https://perception-portfolio.vercel.app',
    siteName: 'PERCEPTION',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PERCEPTION | Siam\'s Portfolio',
    description: 'An immersive 3D portfolio',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
