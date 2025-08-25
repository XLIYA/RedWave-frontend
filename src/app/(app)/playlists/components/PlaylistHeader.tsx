'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import type { Order } from './types'

type Props = {
  query: string
  onQueryChange: (v: string) => void
  order: Order
  onOrderChange: (v: Order) => void
  onOpenCreate: () => void
}

export default function PlaylistHeader({
  query,
  onQueryChange,
  order,
  onOrderChange,
  onOpenCreate,
}: Props) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left" dir="ltr">
      <div className="flex-1 min-w-64">
        <h1 className="text-3xl font-bold">My playlists</h1>
        <p className="text-muted-foreground mt-1">Create, organize, and enjoy your collections.</p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Search playlists…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="pl-3 w-72 text-left"
        />

        <Select value={order} onValueChange={(v) => onOrderChange(v as Order)}>
          <SelectTrigger className="w-44 text-left">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="recent">Most recent</SelectItem>
            <SelectItem value="alphabetical">Alphabetical</SelectItem>
          </SelectContent>
        </Select>

        <Button className="btn-gradient" type="button" onClick={onOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New playlist
        </Button>
      </div>
    </div>
  )
}
