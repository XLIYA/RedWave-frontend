'use client'

import { useEffect } from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Header } from './Header'
import { useSidebar } from '@/hooks/useSidebar'
import { cn } from '@/lib/utils'
import { AppSidebar } from './AppSidebar'

interface ShellProps {
  children: React.ReactNode
  className?: string
  contentClassName?: string
  withPlayerOffset?: boolean
}

export function Shell({
  children,
  className,
  contentClassName,
  withPlayerOffset = true,
}: ShellProps) {
  const { isOpen, isMobile, close } = useSidebar()

  // قفل اسکرول در موبایل وقتی سایدبار باز است
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobile, isOpen])

  return (
    <SidebarProvider>
      <div className={cn('flex min-h-screen w-full bg-background', className)}>
        {/* Floating Sidebar - مستقل از layout اصلی */}
        <AppSidebar />

        {/* Main Layout - Full width */}
        <div className="flex flex-1 flex-col min-w-0 w-full">
          {/* Header - Full width, fixed position */}
          <Header />

          {/* Main Content */}
          <main
            className={cn(
              'flex-1 w-full overflow-auto transition-all duration-300',
              // فاصله از سمت چپ برای ساید‌بار (فقط در دسکتاپ)
              'md:pl-20', // حداقل فاصله برای ساید‌بار collapsed
              // padding برای محتوا
              'p-6',
              // فاصله برای player
              withPlayerOffset && 'pb-24',
              // blur effect در موبایل
              isMobile && isOpen && 'blur-sm pointer-events-none',
              contentClassName
            )}
          >
            {/* Container با حداکثر عرض */}
            <div className="mx-auto max-w-7xl w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}