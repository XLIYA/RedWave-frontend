'use client'

import Image from 'next/image'
import { Music } from 'lucide-react'
import type { SongItem } from './types'

type Props = { song: SongItem }

export default function UploadCard({ song }: Props) {
  return (
    <div className="glass p-4 rounded-lg card-hover">
      <div className="aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
        {song.coverImage ? (
          <Image src={song.coverImage} alt={song.title} width={200} height={200} className="w-full h-full object-cover" />
        ) : (
          <Music className="w-12 h-12 text-white" />
        )}
      </div>
      <h3 className="font-semibold truncate">{song.title}</h3>
      <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
      {song.genre && <p className="text-xs text-muted-foreground mt-1">{song.genre}</p>}
      {song.analytics?.playCount && (
        <p className="text-xs text-muted-foreground mt-1">{song.analytics.playCount.toLocaleString('en-US')} plays</p>
      )}
    </div>
  )
}
