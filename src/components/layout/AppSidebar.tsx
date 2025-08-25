'use client'

import { Home, Search, ListMusic, Upload, User, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const navigationItems = [
  { title: 'Home', url: '/home', icon: Home, description: 'Your music feed' },
  { title: 'Explore', url: '/explore', icon: Search, description: 'Discover new music' },
  { title: 'Playlists', url: '/playlists', icon: ListMusic, description: 'Your collections' },
]

const adminItems = [{ title: 'Upload', url: '/upload', icon: Upload, description: 'Upload new tracks' }]

const settingsItems = [
  { title: 'Profile', url: '/profile', icon: User, description: 'Manage your profile' },
  { title: 'Settings', url: '/settings', icon: Settings, description: 'App preferences' },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const isAdmin = user?.role?.toUpperCase?.() === 'ADMIN'
  const shouldExpand = isOpen || isHovered

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setIsOpen(false)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const SidebarItem = ({ item, isActive }: { item: any; isActive: boolean }) => {
    const content = (
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className={cn(
          'group relative h-12 rounded-xl transition-all duration-300 hover:scale-[1.02]',
          'hover:bg-red-500/10 hover:border-red-500/20 border border-transparent',
          isActive && 'bg-gradient-to-r from-red-600/20 to-rose-600/20 border-red-500/30 shadow-lg shadow-red-500/10',
          !shouldExpand && 'justify-center w-12 mx-auto'
        )}
      >
        <Link
          href={item.url}
          className={cn('flex items-center gap-3 w-full px-3', !shouldExpand && 'justify-center px-0')}
        >
          <div className={cn('relative flex items-center justify-center', isActive && 'text-red-400')}>
            <item.icon className="h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
            {isActive && <div className="absolute inset-0 bg-red-500/20 rounded-lg blur-sm animate-pulse" />}
          </div>
          {shouldExpand && (
            <div className="flex-1 animate-in slide-in-from-left-2 duration-300">
              <span
                className={cn(
                  'font-medium text-sm transition-colors duration-300',
                  isActive ? 'text-red-300' : 'text-gray-300 group-hover:text-white'
                )}
              >
                {item.title}
              </span>
              {item.description && (
                <p className="text-xs text-gray-500 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {item.description}
                </p>
              )}
            </div>
          )}
        </Link>
      </SidebarMenuButton>
    )

    if (!shouldExpand) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="right" className="ml-2 bg-gray-900/95 backdrop-blur-xl border-white/10 text-white">
              <div>
                <p className="font-medium">{item.title}</p>
                {item.description && <p className="text-xs text-gray-400 mt-1">{item.description}</p>}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }
    return content
  }

  return (
    <>
      {/* Floating Island Sidebar */}
      <div
        className={cn(
          'fixed z-50 left-4', // z-50 تا از هدر جلوتر باشه
          'top-20 bottom-4', // شروع درست از زیر هدر (هدر 5rem = 80px ≈ top-20)
          'pointer-events-none' // اجازه کلیک روی محتوای پشت
        )}
      >
        <div className="group/sidebar relative h-full pointer-events-auto">
          {/* Ambient Glow Effect - تنها هنگام hover */}
          <div className="pointer-events-none absolute -inset-2 rounded-3xl bg-gradient-to-b from-rose-500/20 via-red-500/10 to-transparent opacity-0 blur-xl transition-opacity duration-700 group-hover/sidebar:opacity-100" />
          
          {/* Subtle Shadow Ring */}
          <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-br from-red-500/5 via-transparent to-rose-500/5 opacity-60" />

          {/* Main Container */}
          <div
            className={cn(
              'relative h-full transition-all duration-500 ease-out',
              shouldExpand ? 'w-72' : 'w-14' // عرض کمتر در حالت بسته
            )}
            onMouseEnter={() => !isMobile && setIsHovered(true)}
            onMouseLeave={() => !isMobile && setIsHovered(false)}
          >
            <Sidebar className="h-full bg-transparent border-0 rounded-2xl overflow-hidden shadow-none">
              {/* Glass Background Card */}
              <div
                className={cn(
                  'absolute inset-0 rounded-2xl backdrop-blur-2xl transition-all duration-500',
                  'bg-gray-950/40 border border-white/10',
                  'shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
                  shouldExpand && 'shadow-[0_16px_48px_rgba(0,0,0,0.4)] border-white/20'
                )}
              />

              {/* Toggle Button - فقط در دسکتاپ */}
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(!isOpen)}
                  className={cn(
                    'absolute -right-3 top-6 z-20 h-7 w-7 rounded-full',
                    'bg-gray-900/90 backdrop-blur-md border border-white/20',
                    'hover:bg-red-500/20 hover:border-red-400/40 hover:shadow-lg hover:shadow-red-500/20',
                    'transition-all duration-300 group/toggle opacity-90 hover:opacity-100'
                  )}
                >
                  {shouldExpand ? (
                    <ChevronLeft className="h-3.5 w-3.5 text-gray-300 group-hover/toggle:text-red-300 transition-colors" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover/toggle:text-red-300 transition-colors" />
                  )}
                </Button>
              )}

              <SidebarContent className="relative z-10 px-4 py-6 space-y-6">
                {/* Navigation Section */}
                <SidebarGroup>
                  {shouldExpand && (
                    <SidebarGroupLabel className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      Discover
                    </SidebarGroupLabel>
                  )}
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-1">
                      {navigationItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarItem item={item} isActive={pathname === item.url} />
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Admin Section */}
                {isAdmin && (
                  <SidebarGroup>
                    {shouldExpand && (
                      <SidebarGroupLabel className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                        Admin
                        <Badge className="ml-auto bg-red-600/20 text-red-400 border-red-600/30 text-xs px-2 py-0.5">
                          Admin
                        </Badge>
                      </SidebarGroupLabel>
                    )}
                    <SidebarGroupContent>
                      <SidebarMenu className="space-y-1">
                        {adminItems.map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <SidebarItem item={item} isActive={pathname === item.url} />
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )}

                {/* Account Section */}
                <SidebarGroup>
                  {shouldExpand && (
                    <SidebarGroupLabel className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                      Account
                    </SidebarGroupLabel>
                  )}
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-1">
                      {settingsItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarItem item={item} isActive={pathname === item.url} />
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>

              {/* Footer */}
              <SidebarFooter className="relative z-10 border-t border-white/10 p-4">
                <div className="space-y-3">
                  {/* Logout Button */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          onClick={handleLogout}
                          className={cn(
                            'w-full h-11 rounded-xl border border-white/10 group/logout',
                            'text-gray-300 hover:text-white hover:bg-red-500/10 hover:border-red-400/30',
                            'transition-all duration-300 hover:scale-[1.02]',
                            shouldExpand ? 'justify-start px-4' : 'justify-center px-0'
                          )}
                        >
                          <LogOut className="h-4 w-4 flex-shrink-0 group-hover/logout:scale-110 transition-transform duration-300" />
                          {shouldExpand && <span className="ml-3 font-medium text-sm">Logout</span>}
                        </Button>
                      </TooltipTrigger>
                      {!shouldExpand && (
                        <TooltipContent side="right" className="ml-2 bg-gray-900/95 backdrop-blur-xl border-white/10 text-white">
                          Logout
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </SidebarFooter>
            </Sidebar>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
          aria-label="Close sidebar"
        />
      )}
    </>
  )
}