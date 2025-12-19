import React from 'react'
import { ThemeProvider } from './theme'
import { SettingsProvider } from './settings'
import { SearchProvider } from './search'
import { DownloadProvider } from './download'
import { UIProvider } from './ui'

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <SearchProvider>
          <DownloadProvider>
            <UIProvider>{children}</UIProvider>
          </DownloadProvider>
        </SearchProvider>
      </SettingsProvider>
    </ThemeProvider>
  )
}
