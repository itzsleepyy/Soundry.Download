import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

type ThemeContextValue = {
  currentTheme: string
  setTheme: (theme: 'light' | 'dark') => void
  switchTheme: () => void
  setLightAlias: (alias: string) => void
  setDarkAlias: (alias: string) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('dark')
  const [lightAlias, setLightAlias] = useState('light')
  const [darkAlias, setDarkAlias] = useState('dark')

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setCurrentTheme(prefersDark ? 'dark' : 'light')
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      currentTheme === 'dark' ? darkAlias : lightAlias
    )
  }, [currentTheme, darkAlias, lightAlias])

  const value = useMemo(
    () => ({
      currentTheme,
      setTheme: setCurrentTheme,
      switchTheme: () =>
        setCurrentTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
      setLightAlias,
      setDarkAlias,
    }),
    [currentTheme, darkAlias, lightAlias]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useBinaryThemeManager = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useBinaryThemeManager must be used within ThemeProvider')
  }
  return ctx
}
