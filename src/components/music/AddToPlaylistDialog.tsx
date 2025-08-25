'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Music, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { Track } from '@/lib/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AddToPlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track | null;
}

interface Playlist {
  id: string;
  name: string;
  description?: string;
  trackCount?: number;
  isPublic?: boolean;
  coverImage?: string;
}

export const AddToPlaylistDialog: React.FC<AddToPlaylistDialogProps> = ({
  open,
  onOpenChange,
  track,
}) => {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedPlaylist(null);
      setSearchQuery('');
      setNewPlaylistName('');
      setShowCreateForm(false);
    }
  }, [open]);

  // Load playlists when dialog opens
  useEffect(() => {
    if (!open || !track) return;

    const loadPlaylists = async () => {
      // Check authentication first
      if (!api.isAuthenticated()) {
        toast.error('Please sign in to add tracks to playlists');
        // Optional: redirect to login
        // router.push('/login');
        onOpenChange(false);
        return;
      }

      setLoading(true);
      try {
        const response = await api.getPlaylists({ pageSize: 50 });
        setPlaylists((response as any)?.items || []);
      } catch (error) {
        console.error('Failed to load playlists:', error);
        toast.error('Failed to load playlists');
        setPlaylists([]);
      } finally {
        setLoading(false);
      }
    };

    loadPlaylists();
  }, [open, track, onOpenChange, router]);

  // Filter playlists based on search
  const filteredPlaylists = useMemo(() => {
    if (!searchQuery.trim()) return playlists;
    const query = searchQuery.toLowerCase();
    return playlists.filter(playlist =>
      playlist.name.toLowerCase().includes(query) ||
      playlist.description?.toLowerCase().includes(query)
    );
  }, [playlists, searchQuery]);

  const handleAddToPlaylist = async () => {
    if (!selectedPlaylist || !track) return;

    setAdding(true);
    try {
      await api.addSongToPlaylist(selectedPlaylist.id, track.id);
      toast.success(`Added "${track.title}" to "${selectedPlaylist.name}"`);
      onOpenChange(false);
    } catch (error: any) {
      if (error?.status === 409 || error?.status === 400) {
        toast.info(`"${track.title}" is already in "${selectedPlaylist.name}"`);
        onOpenChange(false);
      } else {
        console.error('Failed to add to playlist:', error);
        toast.error('Failed to add track to playlist');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim() || !track) return;

    setCreatingPlaylist(true);
    try {
      // Create playlist
      const newPlaylist = await api.createPlaylist({ 
        name: newPlaylistName.trim() 
      });
      
      // Add track to the new playlist
      await api.addSongToPlaylist(newPlaylist.id, track.id);
      
      toast.success(`Created "${newPlaylistName}" and added "${track.title}"`);
      
      // Update local playlists list optimistically
      setPlaylists(prev => [newPlaylist, ...prev]);
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to create playlist and add track:', error);
      toast.error('Failed to create playlist');
    } finally {
      setCreatingPlaylist(false);
    }
  };

  if (!open || !track) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Add to Playlist
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Add "{track.title}" by {track.artist} to a playlist
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search playlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Playlist List */}
          <ScrollArea className="h-[240px]">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredPlaylists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Music className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'No playlists match your search' : 'No playlists found'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateForm(true)}
                  className="mt-2"
                >
                  Create your first playlist
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredPlaylists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => setSelectedPlaylist(playlist)}
                    className={`w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors hover:bg-muted ${
                      selectedPlaylist?.id === playlist.id ? 'bg-muted ring-1 ring-ring' : ''
                    }`}
                    aria-label={`Select ${playlist.name} playlist`}
                  >
                    <div className="relative">
                      {playlist.coverImage ? (
                        <img
                          src={playlist.coverImage}
                          alt={`${playlist.name} cover`}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                          <Music className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{playlist.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {playlist.trackCount !== undefined && (
                          <span>{playlist.trackCount} tracks</span>
                        )}
                        {playlist.isPublic !== undefined && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {playlist.isPublic ? 'Public' : 'Private'}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Create New Playlist */}
          {!loading && (
            <>
              <Separator />
              <div className="space-y-3">
                {!showCreateForm ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateForm(true)}
                    className="w-full justify-start"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create new playlist
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder="Playlist name..."
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newPlaylistName.trim()) {
                          handleCreateAndAdd();
                        } else if (e.key === 'Escape') {
                          setShowCreateForm(false);
                          setNewPlaylistName('');
                        }
                      }}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCreateAndAdd}
                        disabled={!newPlaylistName.trim() || creatingPlaylist}
                        size="sm"
                        className="flex-1"
                      >
                        {creatingPlaylist ? 'Creating...' : 'Create & Add'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewPlaylistName('');
                        }}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddToPlaylist}
            disabled={!selectedPlaylist || adding || loading}
          >
            {adding ? 'Adding...' : 'Add to Playlist'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};