import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import API from './api'

type Settings = {
  audio_providers: string[]
  lyrics_providers: string[]
  format: string
  output: string
}

type SettingsContextValue = {
  settings: Settings
  setSettings: React.Dispatch<React.SetStateAction<Settings>>
  settingsOptions: {
    audio_providers: string[]
    lyrics_providers: string[]
    format: string[]
    output: string
  }
  saveSettings: () => void
  isSaved: boolean | null
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

const defaultSettings: Settings = {
  audio_providers: ['youtube-music', 'youtube'],
  lyrics_providers: ['genius'],
  format: 'mp3',
  output: '/downloads/{artists} - {title}.{output-ext}',
}

const settingsOptions = {
  audio_providers: ['youtube', 'youtube-music'],
  lyrics_providers: ['genius', 'musixmatch', 'azlyrics'],
  format: ['mp3', 'flac', 'ogg', 'opus', 'm4a'],
  output: '/downloads/{artists} - {title}.{output-ext}',
}

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [isSaved, setIsSaved] = useState<boolean | null>(null)

  useEffect(() => {
    API.getSettings().then((res) => {
      if (res.status === 200) {
        let output = res.data.output || '/downloads/{artists} - {title}.{output-ext}'
        if (!output.startsWith('/downloads')) {
          output = '/downloads/' + output
        }
        setSettings((prev) => ({
          ...prev,
          ...res.data,
          format: res.data.format || 'mp3',
          output,
          audio_providers: res.data.audio_providers?.length
            ? res.data.audio_providers
            : ['youtube-music', 'youtube'],
          lyrics_providers: res.data.lyrics_providers?.length
            ? res.data.lyrics_providers
            : ['genius'],
        }))
      }
    })
  }, [])

  const saveSettings = () => {
    API.setSettings(settings)
      .then((res) => {
        if (res.status === 200) {
          setIsSaved(true)
          setTimeout(() => setIsSaved(null), 2000)
        } else {
          setIsSaved(false)
          setTimeout(() => setIsSaved(null), 2000)
        }
      })
      .catch(() => {
        setIsSaved(false)
        setTimeout(() => setIsSaved(null), 2000)
      })
  }

  const value = useMemo(
    () => ({
      settings,
      setSettings,
      settingsOptions,
      saveSettings,
      isSaved,
    }),
    [settings, isSaved]
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export const useSettingsManager = () => {
  const ctx = useContext(SettingsContext)
  if (!ctx) {
    throw new Error('useSettingsManager must be used within SettingsProvider')
  }
  return ctx
}
