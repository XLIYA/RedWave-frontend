'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Music2,
  Play,
  Trash2,
  Pencil,
} from 'lucide-react'
import type { PlaylistItem } from './types'

type Props = {
  items: PlaylistItem[]
  loading: boolean
  page: number
  pages: number
  onPrev: () => void
  onNext: () => void
  onEditClick: (pl: PlaylistItem) => void
  onDeleteClick: (id: string) => void
  canUpdate: boolean
  canDelete: boolean
  formatDuration: (sec: number) => string
  formatNumber: (n: number) => string
  routeBase?: string
  onPlay?: (id: string) => void
}

const getPlaylistId = (pl: any): string | undefined => {
  const candidate = pl?.id ?? pl?._id ?? pl?.uuid ?? pl?.slug
  return typeof candidate === 'string' && candidate.length > 0 ? candidate : undefined
}

export default function PlaylistGrid({
  items,
  loading,
  page,
  pages,
  onPrev,
  onNext,
  onEditClick,
  onDeleteClick,
  canUpdate,
  canDelete,
  formatDuration,
  formatNumber,
  routeBase = '/playlists',
  onPlay,
}: Props) {
  if (loading) {
    return (
      <div className="space-y-8 text-left" dir="ltr">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square rounded-2xl" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!items.length) {
    return (
      <Card className="text-left" dir="ltr">
        <CardContent className="py-12">
          <div className="text-muted-foreground mb-4">
            <div className="text-6xl mb-4">♪</div>
            <p className="text-lg">You don’t have any playlists yet.</p>
            <p className="text-sm">Create your first playlist to get started.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="text-left" dir="ltr">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
        {items.map((pl) => {
          const pid = getPlaylistId(pl)
          const href = pid ? `${routeBase}/${encodeURIComponent(pid)}` : undefined
          const key = String(pl.id ?? pl._id ?? pl.uuid ?? pl.slug ?? pl.name)

          return (
            <div key={key} className="relative group">
              {/* هالوی قرمز پشت کارت در هاور */}
              <div
                aria-hidden
                className="absolute inset-0 -z-10 rounded-3xl bg-red-500/20 opacity-0 blur-xl translate-y-2 transition duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0"
              />
              <Card
                className="relative z-10 overflow-hidden rounded-2xl border bg-card transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl group-hover:border-red-500/30"
              >
                <CardContent className="p-0">
                  {/* Media: انحنای تصویر = کارت */}
                  <div className="relative aspect-square bg-gradient-to-br from-rose-500 to-fuchsia-600 overflow-hidden rounded-t-2xl">
                    {pl.coverImage ? (
                      <Image
                        src={pl.coverImage}
                        alt={pl.name || 'Playlist cover'}
                        width={1200}
                        height={1200}
                        className="block h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transform-none"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/90">
                        <Music2 className="h-16 w-16" />
                      </div>
                    )}

                    {/* شِین روی کاور */}
                    <div
                      className="pointer-events-none absolute inset-0 -translate-x-[120%] opacity-0 transition-all duration-700 ease-out group-hover:translate-x-[120%] group-hover:opacity-100"
                      aria-hidden
                      style={{
                        background:
                          'linear-gradient(110deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 70%)',
                      }}
                    />

                    {/* Overlay اکشن‌ها با هاور قرمز ملایم */}
                    <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/0 opacity-0 transition-all duration-300 ease-out group-hover:bg-black/30 group-hover:opacity-100">
                      {onPlay && pid ? (
                        <Button
                          size="icon"
                          className="h-10 w-10 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-500 transition-transform duration-300 ease-out translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            onPlay(pid)
                          }}
                          aria-label="Play playlist"
                          type="button"
                        >
                          <Play className="h-5 w-5" />
                          <span className="sr-only">Play</span>
                        </Button>
                      ) : href ? (
                        <Button
                          asChild
                          size="icon"
                          className="h-10 w-10 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-500 transition-transform duration-300 ease-out translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                        >
                          <Link href={href} aria-label="Open playlist">
                            <Play className="h-5 w-5" />
                            <span className="sr-only">Open</span>
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          className="h-10 w-10 rounded-full transition-transform duration-300 ease-out translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                          disabled
                          aria-disabled
                          type="button"
                          title="Missing playlist id"
                        >
                          <Play className="h-5 w-5" />
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 transition-transform duration-300 ease-out translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                            aria-label="More actions"
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-44">
                          <DropdownMenuItem onClick={() => onEditClick(pl)} disabled={!canUpdate}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Rename / Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => pid && onDeleteClick(pid)}
                            disabled={!canDelete || !pid}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Body ـ کامپکت */}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-base truncate" title={pl.name}>
                        {pl.name}
                      </h3>
                    </div>

                    {pl.description && (
                      <p
                        className="text-xs text-muted-foreground mt-1 line-clamp-2"
                        title={pl.description}
                      >
                        {pl.description}
                      </p>
                    )}

                    <div className="text-xs text-muted-foreground space-y-0.5 mt-2">
                      <p>{formatNumber(pl._count?.songs || pl.trackCount || 0)} songs</p>
                      {pl.duration ? <p>{formatDuration(pl.duration)}</p> : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-start gap-2 mt-6">
          <Button variant="outline" onClick={onPrev} type="button">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Prev
          </Button>
          <span className="text-sm">Page {page} of {pages}</span>
          <Button variant="outline" onClick={onNext} type="button">
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  )
}
