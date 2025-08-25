'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'

type Props = { message?: string; error?: string }

export default function Messages({ message, error }: Props) {
  if (!message && !error) return null
  return (
    <div className="space-y-3">
      {message ? (
        <Alert className="border-green-500/50 bg-green-500/10">
          <AlertDescription className="text-green-600">{message}</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertDescription className="text-destructive">{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
