import React, { createContext, useContext, useMemo, useState } from 'react'
import API from './api'
import type { Song } from '../types'

type SearchContextValue = {
  searchTerm: string
  setSearchTerm: (value: string) => void
  results: Song[]
  isSearching: boolean
  error: boolean
  errorValue: string
  searchFor: (query: string) => void
  isValid: (value: string) => boolean
  isValidSearch: (value: string) => boolean
  isValidURL: (value: string) => boolean
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined)

export const SearchProvider = ({ children }: { children: React.ReactNode }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<Song[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState(false)
  const [errorValue, setErrorValue] = useState('')

  const isValidSearch = (value: string) => {
    if (
      value === '' ||
      value.includes('://open.spotify.com/album/') ||
      value.includes('://open.spotify.com/playlist/') ||
      value.includes('://open.spotify.com/show/') ||
      value.includes('://open.spotify.com/artist/') ||
      value.includes('soundcloud.com/') ||
      value.includes('snd.sc/') ||
      value.includes('youtube.com/') ||
      value.includes('youtu.be/') ||
      value.includes('music.youtube.com/')
    ) {
      return false
    }
    return true
  }

  const isValidURL = (value: string) => {
    if (
      (value.includes('://open.spotify.com/track/') ||
        value.includes('://open.spotify.com/album/') ||
        value.includes('://open.spotify.com/playlist/') ||
        value.includes('://open.spotify.com/artist/') ||
        value.includes('soundcloud.com/') ||
        value.includes('snd.sc/') ||
        value.includes('youtube.com/') ||
        value.includes('youtu.be/') ||
        value.includes('music.youtube.com/')) &&
      localStorage.getItem('version') >= '4.2.1'
    ) {
      return true
    }
    if (value.includes('://open.spotify.com/track/')) {
      return true
    }
    return false
  }

  const searchFor = (query: string) => {
    setResults([])
    setIsSearching(true)
    setSearchTerm(query)
    setError(false)
    setErrorValue('')

    API.search(query)
      .then((res) => {
        if (res.status === 200) {
          setResults(res.data || [])
          setIsSearching(false)
        } else {
          setIsSearching(false)
          setError(true)
          setErrorValue(String(res))
        }
      })
      .catch((err) => {
        setIsSearching(false)
        setError(true)
        setErrorValue(err.message)
      })
  }

  const value = useMemo(
    () => ({
      searchTerm,
      setSearchTerm,
      results,
      isSearching,
      error,
      errorValue,
      searchFor,
      isValid: (value: string) => isValidSearch(value) || isValidURL(value),
      isValidSearch,
      isValidURL,
    }),
    [searchTerm, results, isSearching, error, errorValue]
  )

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
}

export const useSearchManager = () => {
  const ctx = useContext(SearchContext)
  if (!ctx) {
    throw new Error('useSearchManager must be used within SearchProvider')
  }
  return ctx
}
