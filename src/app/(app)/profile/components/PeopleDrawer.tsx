'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Users, User as UserIcon, X } from 'lucide-react'
import Image from 'next/image'
import type { FollowUser } from './types'

type Props = {
  open: boolean
  type: 'followers' | 'following'
  users: FollowUser[]
  loading: boolean
  searchQuery: string
  onOpenChange: (open: boolean) => void
  onSearchChange: (q: string) => void
}

export default function PeopleDrawer({
  open,
  type,
  users,
  loading,
  searchQuery,
  onOpenChange,
  onSearchChange,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="ltr">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{type === 'followers' ? 'Followers' : 'Following'}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search…"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))
            ) : users.length > 0 ? (
              users.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                      {u.profileImage ? (
                        <Image src={u.profileImage} alt={u.username} width={40} height={40} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-white" />
                      )}
                    </div>
                    {u.isOnline && (
                      <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-green-500 border border-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{u.username}</p>
                    <p className="text-xs text-muted-foreground">{u.isOnline ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-muted-foreground">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5" />
                  <p className="text-sm">No users found</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
