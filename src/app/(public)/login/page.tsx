//src/app/(public)/login/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/useAuth'
import { Logo } from '@/components/common/Logo'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const { login, isLoading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Client-side validation
    if (!username.trim()) {
      setError('Username is required')
      return
    }

    if (!password.trim()) {
      setError('Password is required')
      return
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters')
      return
    }

    try {
      console.log('Attempting login for:', username)
      await login(username.trim(), password)
      
      console.log('Login successful, redirecting...')
      router.push('/home')
    } catch (err: any) {
      console.error('Login error:', err)
      
      // Extract meaningful error message
      let errorMessage = 'Login failed. Please check your credentials.'
      
      if (err?.message) {
        errorMessage = err.message
      } else if (err?.status === 401) {
        errorMessage = 'Invalid username or password'
      } else if (err?.status === 400) {
        errorMessage = 'Please check your username and password'
      } else if (err?.status === 0) {
        errorMessage = 'Cannot connect to server. Please try again.'
      } else if (err?.status >= 500) {
        errorMessage = 'Server error. Please try again later.'
      }
      
      setError(errorMessage)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-red-900 to-red-700 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255, 0, 0, 0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.1),transparent)]"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>

      {/* Login Card */}
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto">
            <Logo size="lg" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">RedWave</CardTitle>
            <CardDescription className="text-white/80 mt-2">
              Feel the sound, ride the wave
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-300/50 bg-red-500/10 backdrop-blur">
              <AlertDescription className="text-red-100">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white/90">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                disabled={isLoading}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-red-400 focus:ring-red-400/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/90">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-red-400 focus:ring-red-400/20 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-white/70 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all"
              disabled={isLoading || !username.trim() || !password.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-white/60 text-sm">
              Don't have an account?{' '}
              <Button
                variant="link"
                className="text-red-300 hover:text-red-200 p-0 h-auto"
                onClick={() => router.push('/register')}
                disabled={isLoading}
              >
                Sign up
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}