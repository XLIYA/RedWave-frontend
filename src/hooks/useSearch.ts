'use client'

import { useState, useCallback } from 'react'
import { SearchSuggestion } from '@/lib/types'
import { api } from '@/lib/api'

export const useSearch = () => {
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)

  const search = useCallback(async (
    query: string,
    scope: 'songs' | 'users' | 'playlists' = 'songs',
    page = 1,
    pageSize = 20
  ) => {
    if (!query.trim()) return null

    setLoading(true)
    try {
      const result = await api.search({
        q: query.trim(),
        scope,
        page,
        pageSize
      })
      return result
    } catch (error) {
      console.error('Search error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const getSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([])
      return
    }

    setSuggestionsLoading(true)
    try {
      const results = await api.getSearchSuggestions(query.trim())
      setSuggestions(results)
    } catch (error) {
      console.error('Suggestions error:', error)
      setSuggestions([])
    } finally {
      setSuggestionsLoading(false)
    }
  }, [])

  const clearSuggestions = useCallback(() => {
    setSuggestions([])
  }, [])

  return {
    search,
    getSuggestions,
    clearSuggestions,
    suggestions,
    loading,
    suggestionsLoading
  }
}