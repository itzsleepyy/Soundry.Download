import { Icon } from '@iconify/react'
import { useMemo, useState } from 'react'
import API from '../model/api'
import { downloadHelpers, useDownloadManager, useProgressTracker } from '../model/download'
import { useSettingsManager } from '../model/settings'
import type { DownloadItem } from '../types'

const QueueTab = () => {
  const progressTracker = useProgressTracker()
  const downloadManager = useDownloadManager()
  const settingsManager = useSettingsManager()
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [sortOption, setSortOption] = useState<'date-desc' | 'date-asc' | 'name-asc'>('date-desc')

  const filteredQueue = useMemo(() => {
    let list = progressTracker.downloadQueue.filter((item) =>
      progressTracker.isSessionSong(item.song)
    )

    if (sortOption === 'date-desc') {
      list = list.slice().sort((a, b) => b.timestamp - a.timestamp)
    } else if (sortOption === 'date-asc') {
      list = list.slice().sort((a, b) => a.timestamp - b.timestamp)
    } else if (sortOption === 'name-asc') {
      list = list.slice().sort((a, b) => a.song.name.localeCompare(b.song.name))
    }

    return list
  }, [progressTracker.downloadQueue, sortOption])

  const sessionStats = useMemo(() => {
    if (!filteredQueue.length) return null

    const downloading = filteredQueue.filter(downloadHelpers.isDownloading)
    const queued = filteredQueue.filter(downloadHelpers.isQueued)
    const activeCount = downloading.length + queued.length
    if (activeCount === 0) return null

    const total = filteredQueue.length
    const totalProgress = filteredQueue.reduce((acc, item) => {
      if (downloadHelpers.isDownloaded(item)) return acc + 100
      if (downloadHelpers.isDownloading(item)) return acc + item.progress
      return acc
    }, 0)

    const percent = Math.round(totalProgress / total)
    return {
      percent,
      text: activeCount === 1 ? '1 item remaining' : `${activeCount} items remaining`,
    }
  }, [filteredQueue])

  const downloadFile = (url: string | null) => {
    if (!url) return
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = url.split('/').pop() || ''
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
  }

  const triggerDownload = (item: DownloadItem) => {
    settingsManager.saveSettings()
    downloadManager.download(item.song)
  }

  const downloadAll = () => {
    settingsManager.saveSettings()
    filteredQueue.forEach((item) => {
      if (downloadHelpers.isQueued(item)) {
        downloadManager.download(item.song)
      }
    })
  }

  const onSaveSession = async () => {
    const completedItems = filteredQueue.filter(downloadHelpers.isDownloaded)
    if (!completedItems.length) {
      alert('No completed downloads to save.')
      return
    }

    const files = completedItems.map((item) => {
      const url = decodeURIComponent(item.web_download_url || '')
      return url.replace(/^\/downloads\//, '')
    })

    try {
      const response = await API.downloadZip(files)
      const blob = new Blob([response.data], { type: 'application/zip' })
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = 'soundry-session.zip'
      link.click()
    } catch (error) {
      console.error(error)
      alert('Failed to create zip archive.')
    }
  }

  if (!filteredQueue.length) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <Icon icon="clarity:music-note-line" style={{ fontSize: 40, opacity: 0.5 }} />
        <h2>No items in this session</h2>
        <p style={{ color: 'var(--muted)' }}>
          Search for a song or paste a URL to start downloading.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem' }}>
          <h2 style={{ margin: 0 }}>Current Session</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <select
              className="select"
              value={sortOption}
              onChange={(event) =>
                setSortOption(event.target.value as 'date-desc' | 'date-asc' | 'name-asc')
              }
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
            </select>
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
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                className={viewMode === 'list' ? 'btn btn-primary btn-icon' : 'btn btn-ghost btn-icon'}
                type="button"
                onClick={() => setViewMode('list')}
              >
                <Icon icon="clarity:list-line" />
              </button>
              <button
                className={viewMode === 'grid' ? 'btn btn-primary btn-icon' : 'btn btn-ghost btn-icon'}
                type="button"
                onClick={() => setViewMode('grid')}
              >
                <Icon icon="clarity:grid-view-line" />
              </button>
            </div>
            <button className="btn btn-primary" type="button" onClick={downloadAll}>
              <Icon icon="clarity:play-line" /> Start All
            </button>
            <button className="btn" type="button" onClick={onSaveSession}>
              <Icon icon="clarity:archive-line" /> Download Zip
            </button>
          </div>
        </div>
        {sessionStats ? (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--muted)' }}>
              <span>{sessionStats.text}</span>
              <span>{sessionStats.percent}%</span>
            </div>
            <progress value={sessionStats.percent} max={100} style={{ width: '100%' }} />
          </div>
        ) : null}
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-2">
          {filteredQueue.map((item) => (
            <div key={item.song.song_id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ position: 'relative', aspectRatio: '1 / 1' }}>
                <img
                  src={item.song.cover_url}
                  alt={item.song.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.55)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '0.75rem',
                    opacity: 1,
                  }}
                >
                  <strong>{item.song.name}</strong>
                  <span style={{ color: 'var(--muted)' }}>{item.song.artist}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-ghost btn-icon"
                      type="button"
                      onClick={() => downloadManager.remove(item.song)}
                    >
                      <Icon icon="clarity:trash-line" />
                    </button>
                    {downloadHelpers.isDownloaded(item) ? (
                      <button
                        className="btn btn-primary btn-icon"
                        type="button"
                        onClick={() => downloadFile(item.web_download_url)}
                      >
                        <Icon icon="clarity:download-line" />
                      </button>
                    ) : downloadHelpers.isQueued(item) || downloadHelpers.isErrored(item) ? (
                      <button
                        className="btn btn-primary btn-icon"
                        type="button"
                        onClick={() => triggerDownload(item)}
                      >
                        <Icon icon={downloadHelpers.isErrored(item) ? 'clarity:refresh-line' : 'clarity:download-cloud-line'} />
                      </button>
                    ) : (
                      <span className="status">{Math.round(item.progress)}%</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="list">
          {filteredQueue.map((item) => (
            <div key={item.song.song_id} className="card" style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden' }}>
                <img
                  src={item.song.cover_url}
                  alt={item.song.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0 }}>{item.song.name}</h3>
                <p style={{ margin: 0, color: 'var(--muted)' }}>{item.song.artist}</p>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                  {item.message || item.web_status}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  className="btn btn-ghost btn-icon"
                  type="button"
                  onClick={() => downloadManager.remove(item.song)}
                >
                  <Icon icon="clarity:trash-line" />
                </button>
                {downloadHelpers.isDownloaded(item) ? (
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => downloadFile(item.web_download_url)}
                  >
                    <Icon icon="clarity:download-line" /> Save
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => triggerDownload(item)}
                  >
                    <Icon icon={downloadHelpers.isErrored(item) ? 'clarity:refresh-line' : 'clarity:download-cloud-line'} />
                    {downloadHelpers.isErrored(item) ? 'Retry' : 'Convert'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default QueueTab
