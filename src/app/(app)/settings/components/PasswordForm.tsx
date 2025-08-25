// src/components/setting/PasswordForm.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { api } from '@/lib/api'

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password is required')
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'New password and confirmation must match',
    path: ['confirmPassword']
  })

interface PasswordFormProps {
  onMessage?: (message: string, isError?: boolean) => void
}

export default function PasswordForm({ onMessage }: PasswordFormProps) {
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  })

  const handleSubmit = async (data: z.infer<typeof passwordSchema>) => {
    try {
      setError('')
      setSuccess('')

      await api.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      })

      form.reset()
      setSuccess('Password changed successfully.')
      onMessage?.('Password changed successfully.')

      setTimeout(() => setSuccess(''), 5000)
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to change password'
      setError(errorMessage)
      onMessage?.(errorMessage, true)
    }
  }

  return (
    <Card className="glass card-hover text-left">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Change Password
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {success && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-destructive/50 bg-destructive/10">
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showCurrent ? 'text' : 'password'}
                        placeholder="Enter your current password"
                        {...field}
                        className="pl-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute left-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowCurrent(!showCurrent)}
                      >
                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showNew ? 'text' : 'password'}
                        placeholder="New password (min 6 chars)"
                        {...field}
                        className="pl-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute left-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowNew(!showNew)}
                      >
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Re-enter new password"
                        {...field}
                        className="pl-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute left-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirm(!showConfirm)}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={form.formState.isSubmitting} className="btn-gradient">
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    Changing...
                  </>
                ) : (
                  'Change Password'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
