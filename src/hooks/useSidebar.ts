'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarState {
  isOpen: boolean
  isMobile: boolean
  toggle: () => void
  open: () => void
  close: () => void
  setMobile: (mobile: boolean) => void
}

export const useSidebar = create<SidebarState>()(
  persist(
    (set) => ({
      isOpen: true,
      isMobile: false,
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setMobile: (mobile) => set({ isMobile: mobile }),
    }),
    {
      name: 'sidebar-state',
      partialize: (state) => ({ isOpen: state.isOpen }),
    }
  )
)