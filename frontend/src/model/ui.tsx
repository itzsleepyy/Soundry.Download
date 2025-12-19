import React, { createContext, useContext, useMemo, useState } from 'react'

type UIContextValue = {
  settingsOpen: boolean
  openSettings: () => void
  closeSettings: () => void
}

const UIContext = createContext<UIContextValue | undefined>(undefined)

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const [settingsOpen, setSettingsOpen] = useState(false)

  const value = useMemo(
    () => ({
      settingsOpen,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
    }),
    [settingsOpen]
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export const useUI = () => {
  const ctx = useContext(UIContext)
  if (!ctx) {
    throw new Error('useUI must be used within UIProvider')
  }
  return ctx
}
