'use client'

type Counts = {
  followers: number
  following: number
  songs: number
  likes: number
  playlists: number
}

type Props = {
  counts?: Counts
  onOpenFollowers: () => void
  onOpenFollowing: () => void
}

export default function StatsPills({ counts, onOpenFollowers, onOpenFollowing }: Props) {
  if (!counts) return null
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      <button
        onClick={onOpenFollowers}
        className="px-3 py-1 bg-muted rounded-full text-sm hover:bg-muted/80 transition-colors"
      >
        {counts.followers.toLocaleString('en-US')} followers
      </button>
      <button
        onClick={onOpenFollowing}
        className="px-3 py-1 bg-muted rounded-full text-sm hover:bg-muted/80 transition-colors"
      >
        {counts.following.toLocaleString('en-US')} following
      </button>
      <span className="px-3 py-1 bg-muted rounded-full text-sm">
        {counts.songs.toLocaleString('en-US')} songs
      </span>
      <span className="px-3 py-1 bg-muted rounded-full text-sm">
        {counts.likes.toLocaleString('en-US')} likes
      </span>
      <span className="px-3 py-1 bg-muted rounded-full text-sm">
        {counts.playlists.toLocaleString('en-US')} playlists
      </span>
    </div>
  )
}
