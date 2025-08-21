'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useSearch } from '@/hooks/useSearch'
import { debounce } from '@/lib/utils'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({ onSearch, placeholder = "Search...", className }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const { suggestions, getSuggestions, clearSuggestions, suggestionsLoading } = useSearch()
  const searchRef = useRef<HTMLDivElement>(null)

  const debouncedGetSuggestions = debounce(getSuggestions, 300)

  useEffect(() => {
    if (query.length >= 2) {
      debouncedGetSuggestions(query)
      setShowSuggestions(true)
    } else {
      clearSuggestions()
      setShowSuggestions(false)
    }
  }, [query, debouncedGetSuggestions, clearSuggestions])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    setShowSuggestions(false)
    onSearch(searchQuery)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      handleSearch(query.trim())
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSearch(suggestion)
  }

  const clearSearch = () => {
    setQuery('')
    setShowSuggestions(false)
    clearSuggestions()
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(suggestions.length > 0)}
            className="pr-10 pl-10"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute left-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-transparent"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || suggestionsLoading) && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
          {suggestionsLoading ? (
            <div className="p-3 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : (
            <div className="py-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="w-full px-3 py-2 text-right hover:bg-muted transition-colors flex items-center gap-2"
                  onClick={() => handleSuggestionClick(suggestion.value)}
                >
                  <Search className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{suggestion.value}</span>
                  <span className="text-xs text-muted-foreground mr-auto">
                    {suggestion.type === 'title' ?'Title' : 'Artist'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}