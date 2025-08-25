import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AudioProvider from '@/context/AudioProvider'
import PlayerBar from '@/components/player/PlayerBar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RedWave - Music Platform',
  description: 'Modern music streaming platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      {/* حتماً کلاس فونت رو روی body نگه دار */}
      <body className={inter.className}>
        <AudioProvider>
          {/* اگر PlayerBar سراسریه، به کانتینرهای داخلی pb-24 بده */}
          {children}
          <PlayerBar />
        </AudioProvider>
      </body>
    </html>
  )
}
