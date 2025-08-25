'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'

type Props = {
  searchQuery: string
  genre: string
  order: 'recent' | 'popular' | 'alphabetical'
  onSearchChange: (q: string) => void
  onGenreChange: (g: string) => void
  onOrderChange: (o: 'recent' | 'popular' | 'alphabetical') => void
}

export default function UploadsToolbar({
  searchQuery,
  genre,
  order,
  onSearchChange,
  onGenreChange,
  onOrderChange,
}: Props) {
  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex-1 min-w-64">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search uploads…"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* NOTE: Radix requires non-empty value for items */}
      <Select value={genre || 'all'} onValueChange={v => onGenreChange(v === 'all' ? '' : v)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Genre" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All genres</SelectItem>
          <SelectItem value="pop">Pop</SelectItem>
          <SelectItem value="rock">Rock</SelectItem>
          <SelectItem value="electronic">Electronic</SelectItem>
          <SelectItem value="classical">Classical</SelectItem>
        </SelectContent>
      </Select>

      <Select value={order} onValueChange={v => onOrderChange(v as Props['order'])}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Most recent</SelectItem>
          <SelectItem value="popular">Most popular</SelectItem>
          <SelectItem value="alphabetical">Alphabetical</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
