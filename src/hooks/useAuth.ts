'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/lib/types'
import { api } from '@/lib/api'

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<{ user: User; token: string }>
  register: (username: string, password: string) => Promise<User>
  logout: () => void
  checkAuth: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
  setUser: (user: User | null) => void
}

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true })
        try {
          // Call the login API
          const response = await api.login({
            username,
            password
          })
          
          // Extract token from response
          const token = response.token
          if (!token) {
            throw new Error('No token received from server')
          }

          // Set token in API client (already done in api.login)
          // Get full user profile after login
          try {
            const userProfile = await api.getMe()
            
            set({
              user: userProfile,
              token: token,
              isAuthenticated: true,
              isLoading: false,
            })

            return { user: userProfile, token: token }
          } catch (profileError) {
            console.error('Failed to get user profile:', profileError)
            // Still consider login successful if we have token
            const basicUser = {
              id: response.id,
              username: response.username,
              role: (response.role as any) === 'admin' ? 'admin' : (response.role as any),
            } as User
            
            set({
              user: basicUser,
              token: token,
              isAuthenticated: true,
              isLoading: false,
            })

            return { user: basicUser, token: token }
          }
        } catch (error) {
          console.error('Login failed:', error)
          set({ 
            isLoading: false,
            user: null,
            token: null,
            isAuthenticated: false
          })
          
          // Re-throw with a more user-friendly message if needed
          if (error instanceof Error) {
            throw error
          }
          throw new Error('Login failed. Please check your credentials.')
        }
      },

      register: async (username: string, password: string) => {
        set({ isLoading: true })
        try {
          const user = await api.register({
            username,
            password
          })
          
          set({ isLoading: false })
          return user
        } catch (error) {
          console.error('Registration failed:', error)
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        // Clear from API client
        api.clearAuthToken()
        
        // Clear from store
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
      },

      checkAuth: async () => {
        const { token } = get()
        if (!token) {
          set({ isAuthenticated: false, user: null })
          return
        }

        try {
          // Ensure token is set in API client
          api.setAuthToken(token)
          
          const user = await api.getMe()
          set({ 
            user, 
            isAuthenticated: true,
            token 
          })
        } catch (error) {
          console.error('Auth check failed:', error)
          // Token is invalid, clear auth
          get().logout()
        }
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, ...userData } })
        }
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      // Add error handling for storage
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Failed to rehydrate auth state:', error)
        } else if (state?.token) {
          // Ensure token is set in API client on rehydration
          api.setAuthToken(state.token)
        }
      },
    }
  )
)