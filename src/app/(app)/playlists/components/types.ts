export type Order = 'recent' | 'alphabetical'

export type PlaylistItem = {
  _id: string
  uuid: string
  slug: string
  id: string
  name: string
  description?: string | null
  coverImage?: string | null
  duration?: number | null
  trackCount?: number | null
  _count?: { songs?: number | null } | null
}

export type Paged<T> = {
  items: T[]
  pages?: number
  page?: number
  total?: number
}
