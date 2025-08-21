'use client'

import { create } from 'zustand'
import { Track, PlayerState } from '@/lib/types'
import { api } from '@/lib/api'

interface PlayerStore extends PlayerState {
  setCurrentTrack: (track: Track) => void
  play: () => void
  pause: () => void
  togglePlay: () => void
  setVolume: (volume: number) => void
  seek: (time: number) => void
  next: () => void
  previous: () => void
  toggleShuffle: () => void
  toggleRepeat: () => void
  setQueue: (tracks: Track[], startIndex?: number) => void
  addToQueue: (track: Track) => void
  removeFromQueue: (index: number) => void
}

export const usePlayer = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 100,
  currentTime: 0,
  duration: 0,
  queue: [],
  currentIndex: 0,
  shuffle: false,
  repeat: 'none',

  setCurrentTrack: (track: Track) => {
    // Record play for analytics
    if (track.id) {
      api.playSong(track.id).catch(console.error)
    }
    
    set({ 
      currentTrack: track,
      currentTime: 0,
      duration: track.duration || 0
    })
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setVolume: (volume: number) => set({ volume: Math.max(0, Math.min(100, volume)) }),

  seek: (time: number) => set({ currentTime: Math.max(0, time) }),

  next: () => {
    const { queue, currentIndex, shuffle, repeat } = get()
    
    if (queue.length === 0) return
    
    let nextIndex = currentIndex + 1
    
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length)
    } else if (nextIndex >= queue.length) {
      if (repeat === 'all') {
        nextIndex = 0
      } else {
        return // End of queue
      }
    }
    
    const nextTrack = queue[nextIndex]
    if (nextTrack) {
      set({ currentIndex: nextIndex })
      get().setCurrentTrack(nextTrack)
    }
  },

  previous: () => {
    const { queue, currentIndex } = get()
    
    if (queue.length === 0) return
    
    let prevIndex = currentIndex - 1
    if (prevIndex < 0) {
      prevIndex = queue.length - 1
    }
    
    const prevTrack = queue[prevIndex]
    if (prevTrack) {
      set({ currentIndex: prevIndex })
      get().setCurrentTrack(prevTrack)
    }
  },

  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

  toggleRepeat: () => set((state) => ({
    repeat: state.repeat === 'none' ? 'all' : state.repeat === 'all' ? 'one' : 'none'
  })),

  setQueue: (tracks: Track[], startIndex = 0) => {
    set({ 
      queue: tracks, 
      currentIndex: startIndex 
    })
    
    const startTrack = tracks[startIndex]
    if (startTrack) {
      get().setCurrentTrack(startTrack)
    }
  },

  addToQueue: (track: Track) => {
    set((state) => ({ 
      queue: [...state.queue, track] 
    }))
  },

  removeFromQueue: (index: number) => {
    set((state) => {
      const newQueue = state.queue.filter((_, i) => i !== index)
      const newCurrentIndex = index < state.currentIndex 
        ? state.currentIndex - 1 
        : state.currentIndex
        
      return {
        queue: newQueue,
        currentIndex: Math.max(0, Math.min(newCurrentIndex, newQueue.length - 1))
      }
    })
  },
}))