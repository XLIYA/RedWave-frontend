'use client'

import { useState } from 'react'
import {
  Search,
  TrendingUp,
  Users,
  Music,
  Play,
  Sparkles,
  Mic,
  Guitar,
  Headphones,
  Disc,
  AudioLines,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrackCard } from '@/components/music/TrackCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Track, User, Playlist } from '@/lib/types'
import { useSearch } from '@/hooks/useSearch'
import { formatNumber } from '@/lib/utils'

type GenreItem = {
  name: string
  color: string
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const musicGenres: GenreItem[] = [
  { name: 'All',        color: 'from-red-600 to-rose-600', Icon: Music },
  { name: 'Pop',        color: 'from-pink-500 to-red-500', Icon: Mic },
  { name: 'Rock',       color: 'from-orange-500 to-red-600', Icon: Guitar },
  { name: 'Classic',    color: 'from-amber-500 to-red-500', Icon: Disc },
  { name: 'Electronic', color: 'from-red-500 to-pink-500', Icon: Headphones },
  { name: 'Rap',        color: 'from-rose-500 to-red-600', Icon: Mic },
  { name: 'Jazz',       color: 'from-red-400 to-rose-500', Icon: AudioLines },
  { name: 'Blues',      color: 'from-red-600 to-rose-700', Icon: Guitar },
]

export default function ExplorePage() {
  const [selectedGenre, setSelectedGenre] = useState('All')
  const [searchResults, setSearchResults] = useState<{
    songs: Track[]
    users: User[]
    playlists: Playlist[]
  }>({ songs: [], users: [], playlists: [] })
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('songs')

  const { search } = useSearch()

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchQuery('')
      setSearchResults({ songs: [], users: [], playlists: [] })
      return
    }

    setSearchQuery(query)
    setLoading(true)

    try {
      const [songsResult, usersResult, playlistsResult] = await Promise.all([
        search(query, 'songs', 1, 20),
        search(query, 'users', 1, 20),
        search(query, 'playlists', 1, 20),
      ])

      setSearchResults({
        songs: (songsResult?.items as Track[]) || [],
        users: (usersResult?.items as User[]) || [],
        playlists: (playlistsResult?.items as Playlist[]) || [],
      })
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults({ songs: [], users: [], playlists: [] })
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults({ songs: [], users: [], playlists: [] })
  }

  const filteredSongs =
    selectedGenre === 'All'
      ? searchResults.songs
      : searchResults.songs.filter((song) => song.genre === selectedGenre)

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Red-Black Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-red-950 to-black">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%23DC2626&quot; fill-opacity=&quot;0.05&quot;%3E%3Ccircle cx=&quot;30&quot; cy=&quot;30&quot; r=&quot;2&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-bounce" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl animate-bounce delay-500" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-red-400 via-rose-400 to-red-500 bg-clip-text text-transparent">
                Discover Music
              </h1>
            </div>
            <p className="text-xl text-gray-300">Explore the rhythm of your soul</p>
          </div>
          {/* Enhanced Search Bar */}
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-rose-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            <div className="relative">
              <Search className="absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 text-red-400 group-focus-within:text-rose-400 transition-colors" />
              <input
                type="search"
                placeholder="Search for songs, artists, playlists..."
                className="w-full pl-16 pr-6 py-6 text-lg bg-gray-900/70 backdrop-blur-xl border border-gray-700/50 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 focus:bg-gray-900/90"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
              />

              {searchQuery && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                  <Button
                    onClick={() => handleSearch(searchQuery)}
                    size="sm"
                    className="rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 transition-all duration-300 transform hover:scale-105"
                  >
                    Search
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={clearSearch}
                    size="sm"
                    className="rounded-full text-gray-300 hover:text-white hover:bg-gray-800/50"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {!searchQuery ? (
          /* Genre Selection with Awesome Cards */
          <section className="space-y-8">
            <h2 className="text-3xl font-bold text-center text-white mb-8">Choose Your Vibe</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {musicGenres.map((genre, index) => (
                <div
                  key={genre.name}
                  className={`relative group cursor-pointer transform transition-all duration-500 hover:scale-110 ${
                    selectedGenre === genre.name ? 'scale-105' : ''
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => setSelectedGenre(genre.name)}
                >
                  <div
                    className={`absolute -inset-1 bg-gradient-to-r ${genre.color} rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200`}
                  />
                  <Card
                    className={`relative bg-gray-900/70 backdrop-blur-xl border-gray-700/50 rounded-2xl overflow-hidden ${
                      selectedGenre === genre.name ? 'ring-2 ring-red-500' : ''
                    }`}
                  >
                    <CardContent className="p-6 text-center">
                      <div
                        className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r ${genre.color} flex items-center justify-center group-hover:rotate-12 transition-transform duration-300`}
                      >
                        <genre.Icon className="w-6 h-6 text-white" />
                      </div>
                      <p className="font-medium text-white">{genre.name}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </section>
        ) : (
          /* Enhanced Search Results */
          <div className="space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-center mb-8">
                <TabsList className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-full p-1">
                  <TabsTrigger
                    value="songs"
                    className="flex items-center gap-2 rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-rose-600 data-[state=active]:text-white"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Songs ({searchResults.songs.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="users"
                    className="flex items-center gap-2 rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-rose-600 data-[state=active]:text-white"
                  >
                    <Users className="h-4 w-4" />
                    Artists ({searchResults.users.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="playlists"
                    className="flex items-center gap-2 rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-rose-600 data-[state=active]:text-white"
                  >
                    <Music className="h-4 w-4" />
                    Playlists ({searchResults.playlists.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="songs" className="space-y-8">
                <>
                  {/* Genre Filter Pills */}
                  <div className="flex flex-wrap justify-center gap-3">
                    {musicGenres.map((genre) => (
                      <Badge
                        key={genre.name}
                        variant={selectedGenre === genre.name ? 'default' : 'outline'}
                        className={`px-4 py-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                          selectedGenre === genre.name
                            ? `bg-gradient-to-r ${genre.color} text-white border-0`
                            : 'bg-gray-900/50 border-gray-700 text-gray-300 hover:bg-gray-800/50'
                        }`}
                        onClick={() => setSelectedGenre(genre.name)}
                      >
                        <genre.Icon className="w-4 h-4 mr-2 inline-block" />
                        {genre.name}
                      </Badge>
                    ))}
                  </div>

                  {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <Card key={i} className="bg-gray-900/50 backdrop-blur-xl border-gray-700/50 animate-pulse">
                          <CardContent className="p-4">
                            <Skeleton className="aspect-square rounded-xl bg-gray-800/50 mb-4" />
                            <Skeleton className="h-4 w-3/4 bg-gray-800/50 mb-2" />
                            <Skeleton className="h-3 w-1/2 bg-gray-800/50" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : filteredSongs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {filteredSongs.map((track, index) => (
                        <div
                          key={track.id}
                          className="transform transition-all duration-500 hover:scale-105"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <TrackCard track={track} showPlayCount />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <div className="relative">
                        <TrendingUp className="h-20 w-20 text-red-400/50 mx-auto mb-6 animate-bounce" />
                        <div className="absolute -top-2 -right-2">
                          <Sparkles className="h-8 w-8 text-rose-400 animate-pulse" />
                        </div>
                      </div>
                      <p className="text-xl text-gray-300">No songs found in this galaxy</p>
                      <p className="text-gray-500 mt-2">Try exploring another dimension</p>
                    </div>
                  )}
                </>
              </TabsContent>

              <TabsContent value="users" className="space-y-8">
                <>
                  {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="bg-gray-900/50 backdrop-blur-xl border-gray-700/50 animate-pulse">
                          <CardContent className="p-6 text-center">
                            <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4 bg-gray-800/50" />
                            <Skeleton className="h-4 w-3/4 mx-auto bg-gray-800/50" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : searchResults.users.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
                      {searchResults.users.map((user, index) => (
                        <Card
                          key={user.id}
                          className="bg-gray-900/50 backdrop-blur-xl border-gray-700/50 hover:bg-gray-900/70 transition-all duration-500 cursor-pointer group transform hover:scale-105"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <CardContent className="p-6 text-center">
                            <div className="relative mb-4">
                              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-rose-500 mx-auto flex items-center justify-center group-hover:rotate-6 transition-transform duration-300">
                                {user.profileImage ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={user.profileImage}
                                    alt={user.username}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-white font-bold text-xl">
                                    {user.username?.charAt(0)?.toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <Music className="h-3 w-3 text-white" />
                              </div>
                            </div>
                            <h3 className="font-semibold text-white mb-2 truncate">{user.username}</h3>
                            {!!user._count && (
                              <p className="text-sm text-gray-400">
                                {formatNumber(user._count.followers || 0)} followers
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <Users className="h-20 w-20 text-red-400/50 mx-auto mb-6 animate-pulse" />
                      <p className="text-xl text-gray-300">No artists in this dimension</p>
                    </div>
                  )}
                </>
              </TabsContent>

              <TabsContent value="playlists" className="space-y-8">
                <>
                  {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Card
                          key={i}
                          className="bg-gray-900/50 backdrop-blur-xl border-gray-700/50 animate-pulse overflow-hidden"
                        >
                          <Skeleton className="aspect-square bg-gray-800/50" />
                          <CardContent className="p-4">
                            <Skeleton className="h-4 w-3/4 bg-gray-800/50 mb-2" />
                            <Skeleton className="h-3 w-1/2 bg-gray-800/50" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : searchResults.playlists.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {searchResults.playlists.map((playlist, index) => (
                        <Card
                          key={playlist.id}
                          className="bg-gray-900/50 backdrop-blur-xl border-gray-700/50 overflow-hidden hover:bg-gray-900/70 transition-all duration-500 cursor-pointer group transform hover:scale-105"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="relative aspect-square bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center group-hover:from-red-400 group-hover:to-rose-500 transition-all duration-500">
                            <Music className="h-16 w-16 text-white group-hover:scale-110 transition-transform duration-300" />
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <Button size="sm" variant="secondary" className="rounded-full w-8 h-8 p-0">
                                <Play className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-white text-lg mb-2 truncate">
                              {playlist.name}
                            </h3>
                            <div className="text-sm text-gray-400 space-y-1">
                              <p>{formatNumber(playlist._count?.songs || 0)} songs</p>
                              {playlist.owner && (
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-rose-500 flex items-center justify-center text-xs text-white">
                                    {playlist.owner.username?.charAt(0)?.toUpperCase()}
                                  </div>
                                  <span className="truncate">by {playlist.owner.username}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <Music className="h-20 w-20 text-red-400/50 mx-auto mb-6 animate-bounce" />
                      <p className="text-xl text-gray-300">No playlists found in the cosmos</p>
                    </div>
                  )}
                </>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
