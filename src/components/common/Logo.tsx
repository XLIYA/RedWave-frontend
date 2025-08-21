import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6 text-lg',
    md: 'h-8 w-8 text-xl',
    lg: 'h-12 w-12 text-2xl',
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm',
          sizeClasses[size]
        )}
      >
        <span className="text-white font-bold">R</span>
      </div>
      <span className="text-xl font-bold text-foreground">RedWave</span>
    </div>
  )
}