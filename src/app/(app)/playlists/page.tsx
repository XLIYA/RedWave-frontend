'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { formatNumber } from '@/lib/utils'
import type { PlaylistItem, Order, Paged } from './components/types'
import PlaylistHeader from './components/PlaylistHeader'
import Messages from './components/Messages'
import PlaylistGrid from './components/PlaylistGrid'
import CreatePlaylistDialog from './components/CreatePlaylistDialog'
import DeleteConfirmDialog from './components/DeleteConfirmDialog'
import EditPlaylistDialog from './components/EditPlaylistDialog'

const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours} hours ${minutes} minutes`
  return `${minutes} minutes`
}

export default function PlaylistsPage() {
  // data
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([])

  // ui state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // filters / pagination
  const [query, setQuery] = useState('')
  const [order, setOrder] = useState<Order>('recent')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  // create dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })

  // edit dialog
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTarget, setEditTarget] = useState<PlaylistItem | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '' })

  // delete dialog
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // capability flags (don’t crash if backend has no endpoints)
  const canUpdate = typeof (api as any).updatePlaylist === 'function'
  const canDelete = typeof (api as any).deletePlaylist === 'function'

  const resetMessagesSoon = () =>
    setTimeout(() => {
      setMessage('')
      setError('')
    }, 3500)

  const fetchPlaylists = async (nextPage = 1) => {
    try {
      setLoading(true)
      setError('')

      const params: Record<string, string | number> = { page: nextPage, pageSize: 12 }
      if (query.trim()) params.q = query.trim()
      if (order) params.order = order

      const response = (await api.getPlaylists(params)) as Paged<PlaylistItem>
      setPlaylists(response.items || [])
      setPages(response.pages || 1)
      setPage(response.page || nextPage)
    } catch (err: any) {
      console.error('Failed to fetch playlists:', err)
      setError(err?.message || 'Failed to fetch playlists')
      resetMessagesSoon()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlaylists(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchPlaylists(1), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const handleCreate = async () => {
    const name = createForm.name.trim()
    if (!name) return

    setCreating(true)
    try {
      const created = (await api.createPlaylist({
        name,
        description: createForm.description.trim() || undefined,
      })) as PlaylistItem

      setPlaylists(prev => [created, ...prev])
      setIsCreateOpen(false)
      setCreateForm({ name: '', description: '' })
      setMessage('Playlist created')
      resetMessagesSoon()
    } catch (err: any) {
      console.error('Failed to create playlist:', err)
      setError(err?.message || 'Failed to create playlist')
      resetMessagesSoon()
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (pl: PlaylistItem) => {
    setEditTarget(pl)
    setEditForm({
      name: pl.name || '',
      description: pl.description || '',
    })
    setIsEditOpen(true)
  }

  const handleEdit = async () => {
    if (!editTarget) return
    const name = editForm.name.trim()
    if (!name) return

    setEditing(true)
    try {
      if (!canUpdate) throw new Error('Update endpoint not available')
      const updated = (await (api as any).updatePlaylist(editTarget.id, {
        name,
        description: editForm.description.trim() || undefined,
      })) as PlaylistItem

      setPlaylists(prev => prev.map(p => (p.id === updated.id ? { ...p, ...updated } : p)))
      setIsEditOpen(false)
      setEditTarget(null)
      setMessage('Playlist updated')
      resetMessagesSoon()
    } catch (err: any) {
      console.error('Failed to update playlist:', err)
      setError(err?.message || 'Failed to update playlist')
      resetMessagesSoon()
    } finally {
      setEditing(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    setDeleting(true)
    try {
      if (!canDelete) throw new Error('Delete endpoint not available')
      await (api as any).deletePlaylist(deletingId)
      setPlaylists(prev => prev.filter(p => p.id !== deletingId))
      setDeletingId(null)
      setMessage('Playlist deleted')
      resetMessagesSoon()
    } catch (err: any) {
      console.error('Failed to delete playlist:', err)
      setError(err?.message || 'Failed to delete playlist')
      resetMessagesSoon()
    } finally {
      setDeleting(false)
    }
  }

  const onPageChange = (to: number) => {
    if (to < 1 || to > pages || loading) return
    fetchPlaylists(to)
  }

  const headerRight = useMemo(
    () => ({
      order,
      onOrderChange: (v: Order) => setOrder(v),
      openCreate: () => setIsCreateOpen(true),
    }),
    [order]
  )

  return (
    <div className="space-y-8 text-left">
      <PlaylistHeader
        query={query}
        onQueryChange={setQuery}
        order={order}
        onOrderChange={setOrder}
        onOpenCreate={() => setIsCreateOpen(true)}   // ← این باید باشه
      />


      <Messages message={message} error={error} />

      <PlaylistGrid
        items={playlists}
        loading={loading}
        page={page}
        pages={pages}
        onPrev={() => onPageChange(page - 1)}
        onNext={() => onPageChange(page + 1)}
        onEditClick={openEdit}
        onDeleteClick={(id) => setDeletingId(id)}
        canUpdate={canUpdate}
        canDelete={canDelete}
        formatDuration={formatDuration}
        formatNumber={formatNumber}
        routeBase="/playlists"   // ← این خط مهمه
      />

      {/* Create */}
      <CreatePlaylistDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        creating={creating}
        form={createForm}
        setForm={setCreateForm}
        onSubmit={handleCreate}
      />

      {/* Edit */}
      <EditPlaylistDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        editing={editing}
        form={editForm}
        setForm={setEditForm}
        onSubmit={handleEdit}
      />

      {/* Delete */}
      <DeleteConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        deleting={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
