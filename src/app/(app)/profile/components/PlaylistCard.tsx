'use client'

import Image from 'next/image'
import { List } from 'lucide-react'
import type { PlaylistItem } from './types'

type Props = {
  playlist: PlaylistItem
  formatDateEn: (d?: string) => string
}

export default function PlaylistCard({ playlist, formatDateEn }: Props) {
  return (
    <div className="glass p-4 rounded-lg card-hover">
      <div className="aspect-square bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
        {playlist.coverImage ? (
          <Image src={playlist.coverImage} alt={playlist.title} width={200} height={200} className="w-full h-full object-cover" />
        ) : (
          <List className="w-12 h-12 text-white" />
        )}
      </div>
      <h3 className="font-semibold truncate">{playlist.title}</h3>
      {playlist.createdAt && <p className="text-xs text-muted-foreground mt-1">{formatDateEn(playlist.createdAt)}</p>}
    </div>
  )
}
