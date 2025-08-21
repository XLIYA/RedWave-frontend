'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shell } from '@/components/layout/Shell'
import { useAuth } from '@/hooks/useAuth'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkAuth } = useAuth()
  const router = useRouter()

  useEffect(() => { checkAuth() }, [checkAuth])
  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // فقط شِل؛ Provider/PlayerBar اینجا نباشن
  return <Shell className="pb-24">{children}</Shell>
}
