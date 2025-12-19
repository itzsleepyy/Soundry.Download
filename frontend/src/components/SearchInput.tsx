import { useEffect, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
import { useSearchManager } from '../model/search'
import { useDownloadManager } from '../model/download'
import { useSettingsManager } from '../model/settings'

const placeholderOptions = [
  'Crossfire - Stephen',
  'https://open.spotify.com/track/4vfN00PlILRXy5dcXHQE9M?si=e4d9e7c044dd4a8f',
  'drugs - EDEN',
  'Nao Gosto Eu Amo - Henrique e Juliano',
  'Perfect - Ed Sheeran',
  'Lightning Crashes - Live',
]

const SearchInput = () => {
  const navigate = useNavigate()
  const searchManager = useSearchManager()
  const downloadManager = useDownloadManager()
  const settingsManager = useSettingsManager()
  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  const placeholder = useMemo(
    () => placeholderOptions[placeholderIndex % placeholderOptions.length],
    [placeholderIndex]
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => prev + 1)
    }, 6000)

    return () => clearInterval(timer)
  }, [])

  const lookUp = (query: string) => {
    if (searchManager.isValidURL(query)) {
      downloadManager.fromURL(query)
      navigate('/downloads')
    } else if (searchManager.isValidSearch(query)) {
      navigate(`/search/${encodeURIComponent(query)}`)
    }
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <select
          className="select"
          value={settingsManager.settings.format}
          onChange={(event) =>
            settingsManager.setSettings((prev) => ({
              ...prev,
              format: event.target.value,
            }))
          }
        >
          {settingsManager.settingsOptions.format.map((fmt) => (
            <option key={fmt} value={fmt}>
              {fmt.toUpperCase()}
            </option>
          ))}
        </select>
        <input
          className="input"
          type="text"
          placeholder={placeholder}
          value={searchManager.searchTerm}
          onChange={(event) => searchManager.setSearchTerm(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              lookUp(searchManager.searchTerm)
            }
          }}
        />
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => lookUp(searchManager.searchTerm)}
          disabled={downloadManager.loading}
        >
          {searchManager.isValidURL(searchManager.searchTerm) ? 'Download' : 'Search'}
          <Icon
            icon={
              searchManager.isValidURL(searchManager.searchTerm)
                ? 'clarity:download-line'
                : 'clarity:search-line'
            }
            style={{ marginLeft: '0.5rem' }}
          />
        </button>
      </div>
    </div>
  )
}

export default SearchInput
