import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00'
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(d)
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'اکنون'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} دقیقه پیش`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ساعت پیش`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} روز پیش`
  
  return formatDate(date)
}

export function validateAudioFile(file: File): string | null {
  const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg']
  
  if (!allowedTypes.includes(file.type)) {
    return 'فرمت فایل صوتی پشتیبانی نمی‌شود'
  }
  
  if (file.size > 30 * 1024 * 1024) { // 30MB
    return 'حجم فایل صوتی نباید بیش از ۳۰ مگابایت باشد'
  }
  
  return null
}

export function validateImageFile(file: File): string | null {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  
  if (!allowedTypes.includes(file.type)) {
    return 'فرمت تصویر پشتیبانی نمی‌شود'
  }
  
  if (file.size > 5 * 1024 * 1024) { // 5MB
    return 'حجم تصویر نباید بیش از ۵ مگابایت باشد'
  }
  
  return null
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}