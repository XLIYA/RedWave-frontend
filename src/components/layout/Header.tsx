// src/components/layout/Header.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, User, LogOut, Music, Settings } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export function Header() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      router.push('/login')
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    const params = new URLSearchParams({ q })
    router.push(`/explore?${params.toString()}`)
  }

  return (
    <header
      dir="ltr"
      className={cn(
        'sticky top-0 z-50 flex h-20 items-center justify-between transition-all duration-300',
        'border-b backdrop-blur-xl text-left',
        isScrolled
          ? 'bg-gray-950/95 border-white/10 shadow-lg shadow-black/20'
          : 'bg-gray-950/80 border-white/10'
      )}
    >
      <div className="flex items-center justify-between w-full px-6">
        {/* Left: Logo */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-3">
            <div
              aria-label="RedWave"
              className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-lg group hover:scale-105 transition-transform duration-300"
            >
              <Music className="h-5 w-5 text-white group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">
                RedWave
              </h1>
              <p className="text-xs text-gray-400 -mt-1">Music Platform</p>
            </div>
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-2xl mx-8">
          <form onSubmit={handleSearch} className="relative group" role="search" aria-label="Search music">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600/20 to-rose-600/20 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500" />
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors duration-300" />
              <Input
                type="search"
                placeholder="Search tracks, artists, playlists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'pl-12 pr-4 py-3 h-12 rounded-full transition-all duration-300',
                  'bg-gray-900/60 backdrop-blur-sm border-white/10',
                  'focus:bg-gray-900/80 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20',
                  'placeholder:text-gray-500 text-white'
                )}
                aria-label="Search tracks, artists, playlists"
              />
              {searchQuery && (
                <Button
                  type="submit"
                  size="sm"
                  aria-label="Search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 rounded-full transition-all duration-300"
                >
                  Search
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  aria-label="User menu"
                  className="relative h-10 w-10 p-0 rounded-full hover:ring-2 hover:ring-red-500/30 transition-all duration-300"
                >
                  <Avatar className="h-10 w-10 ring-2 ring-gray-700/50 hover:ring-red-500/50 transition-all duration-300">
                    <AvatarImage src={user?.profileImage} alt={user?.username || 'User'} />
                    <AvatarFallback className="bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-64 bg-gray-900/95 backdrop-blur-xl border-gray-700/50 shadow-2xl"
              >
                <DropdownMenuLabel className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user?.profileImage} alt={user?.username || 'User'} />
                      <AvatarFallback className="bg-gradient-to-r from-red-600 to-rose-600 text-white">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{user?.username}</p>
                      <p className="text-sm text-gray-400 capitalize">{user?.role}</p>
                      {user?.role === 'admin' && (
                        <Badge className="mt-1 bg-red-600/20 text-red-400 border-red-600/30 text-xs">Admin</Badge>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="bg-gray-700/50" />

                {/* Profile link */}
                <DropdownMenuItem asChild className="p-0">
                  <Link
                    href="/profile"
                    className="flex w-full items-center p-3 hover:bg-gray-800/50 focus:bg-gray-800/50 outline-none"
                  >
                    <User className="h-4 w-4 mr-3 text-gray-400" />
                    <span className="text-gray-300">Profile</span>
                  </Link>
                </DropdownMenuItem>

                {/* Settings link */}
                <DropdownMenuItem asChild className="p-0">
                  <Link
                    href="/settings"
                    className="flex w-full items-center p-3 hover:bg-gray-800/50 focus:bg-gray-800/50 outline-none"
                  >
                    <Settings className="h-4 w-4 mr-3 text-gray-400" />
                    <span className="text-gray-300">Settings</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-gray-700/50" />

                {/* Logout action */}
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="p-3 hover:bg-red-500/10 hover:text-red-400 cursor-pointer transition-colors duration-300"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Login"
                className="text-gray-300 hover:text-white transition-colors duration-300"
                onClick={() => router.push('/login')}
              >
                Login
              </Button>
              <Button
                size="sm"
                aria-label="Sign up"
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-full px-6 transition-all duration-300"
                onClick={() => router.push('/register')}
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
