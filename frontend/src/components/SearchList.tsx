import { Icon } from '@iconify/react'
import { useSearchManager } from '../model/search'
import { downloadHelpers, useProgressTracker } from '../model/download'
import type { Song } from '../types'

type SearchListProps = {
  data: Song[]
  error: boolean
  onDownload: (song: Song) => void
}

const SearchList = ({ data, error, onDownload }: SearchListProps) => {
  const searchManager = useSearchManager()
  const progressTracker = useProgressTracker()

  if (searchManager.isSearching || error) {
    return (
      <div className="page">
        {searchManager.isSearching ? (
          <div className="status">Loading...</div>
        ) : null}
        {error ? (
          <div className="card" style={{ marginTop: '1rem' }}>
            <strong>Error:</strong> {searchManager.errorValue}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="page">
      <div className="list">
        {data.map((song) => {
          const queuedItem = progressTracker.getBySong(song)
          return (
            <div key={song.song_id} className="card" style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden' }}>
                <img
                  src={song.cover_url}
                  alt={song.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ marginTop: 0, marginBottom: '0.25rem' }}>{song.name}</h3>
                <p style={{ margin: 0, color: 'var(--muted)' }}>
                  {(song.artists || []).join(' • ') || song.artist}
                </p>
                <p style={{ margin: 0, color: 'var(--muted)' }}>{song.album_name}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <a className="btn btn-ghost btn-icon" href={song.url} target="_blank" rel="noreferrer">
                  <Icon icon="clarity:link-line" />
                </a>
                {queuedItem && downloadHelpers.isQueued(queuedItem) ? (
                  <button className="btn btn-primary btn-icon" type="button">
                    <Icon icon="clarity:check-line" />
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-icon"
                    type="button"
                    onClick={() => onDownload(song)}
                  >
                    <Icon icon="clarity:floppy-line" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SearchList
