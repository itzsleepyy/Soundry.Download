import { Icon } from '@iconify/react'
import { useEffect, useMemo, useState } from 'react'
import API from '../model/api'

type DownloadFile = {
  name: string
  timestamp: number
  size: number
  image?: string
}

const ITEMS_PER_PAGE = 50

const formatBytes = (bytes: number, decimals = 2) => {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

const formatDate = (ms: number) => new Date(ms).toLocaleDateString()

const LibraryTab = () => {
  const [files, setFiles] = useState<DownloadFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<Record<string, boolean>>({})
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [sortOption, setSortOption] = useState<'date-desc' | 'date-asc' | 'name-asc'>('date-desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const getExpiresIn = (timestamp: number) => {
    const expiresAt = timestamp + 24 * 60 * 60 * 1000
    const diff = expiresAt - Date.now()
    if (diff <= 0) return 'Expired'
    const hours = Math.ceil(diff / (1000 * 60 * 60))
    if (hours > 1) return `${hours}h left`
    const minutes = Math.ceil(diff / (1000 * 60))
    return `${minutes}m left`
  }

  const getExpiryColor = (timestamp: number) => {
    const expiresAt = timestamp + 24 * 60 * 60 * 1000
    const diff = expiresAt - Date.now()
    const hours = diff / (1000 * 60 * 60)
    if (diff <= 0) return 'var(--error)'
    if (hours < 1) return 'var(--error)'
    if (hours < 6) return '#f59e0b'
    return 'var(--success)'
  }

  const filteredFiles = useMemo(() => {
    let list = [...files]
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      list = list.filter((file) => file.name.toLowerCase().includes(query))
    }

    if (sortOption === 'date-desc') {
      list.sort((a, b) => b.timestamp - a.timestamp)
    } else if (sortOption === 'date-asc') {
      list.sort((a, b) => a.timestamp - b.timestamp)
    } else if (sortOption === 'name-asc') {
      list.sort((a, b) => a.name.localeCompare(b.name))
    }

    return list
  }, [files, searchQuery, sortOption])

  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / ITEMS_PER_PAGE))

  const displayFiles = filteredFiles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const refresh = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await API.listDownloads()
      const items = (res.data || []).map((file: string | DownloadFile) => {
        if (typeof file === 'string') {
          return { name: file, timestamp: 0, size: 0 }
        }
        return file
      })
      setFiles(items)
    } catch {
      setError('Failed to load downloads')
    } finally {
      setLoading(false)
    }
  }

  const onDelete = async (fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return
    setDeleting((prev) => ({ ...prev, [fileName]: true }))
    try {
      await API.deleteDownload(fileName)
      setFiles((prev) => prev.filter((file) => file.name !== fileName))
    } catch {
      alert(`Failed to delete ${fileName}`)
    } finally {
      setDeleting((prev) => ({ ...prev, [fileName]: false }))
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, sortOption])

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 style={{ margin: 0 }}>Library</h2>
          {files.length ? <span className="badge">{files.length}</span> : null}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Icon icon="clarity:search-line" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input
              className="input"
              style={{ paddingLeft: '2.2rem', minWidth: 240 }}
              type="text"
              placeholder="Search library..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <button className="btn btn-ghost btn-icon" type="button" onClick={refresh} disabled={loading}>
            {loading ? '...' : <Icon icon="clarity:refresh-line" />}
          </button>
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
        </div>
      </div>

      {error ? <div className="card">{error}</div> : null}

      {!loading && displayFiles.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Icon icon="clarity:folder-open-line" style={{ fontSize: 40, opacity: 0.5 }} />
          <h2>No files found</h2>
          <p style={{ color: 'var(--muted)' }}>Files you download will appear here.</p>
        </div>
      ) : null}

      {viewMode === 'grid' ? (
        <div className="grid grid-2">
          {displayFiles.map((file) => (
            <div key={file.name} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ position: 'relative', aspectRatio: '1 / 1' }}>
                {file.image ? (
                  <img
                    src={`/downloads/${file.image}`}
                    alt={file.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'grid',
                      placeItems: 'center',
                      background: 'rgba(255,255,255,0.04)',
                    }}
                  >
                    <Icon icon="clarity:music-note-line" style={{ fontSize: 48, opacity: 0.4 }} />
                  </div>
                )}
                <span
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'rgba(0,0,0,0.7)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: 999,
                    fontSize: '0.75rem',
                    color: getExpiryColor(file.timestamp),
                  }}
                >
                  {getExpiresIn(file.timestamp)}
                </span>
              </div>
              <div style={{ padding: '0.75rem' }}>
                <strong>{file.name}</strong>
                <p style={{ color: 'var(--muted)', margin: '0.35rem 0 0' }}>
                  {formatBytes(file.size)} • {formatDate(file.timestamp)}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <a
                    className="btn btn-primary btn-icon"
                    href={`/downloads/${encodeURIComponent(file.name)}`}
                    download
                  >
                    <Icon icon="clarity:download-line" />
                  </a>
                  <button
                    className="btn btn-ghost btn-icon"
                    type="button"
                    onClick={() => onDelete(file.name)}
                    disabled={deleting[file.name]}
                  >
                    {deleting[file.name] ? '...' : <Icon icon="clarity:trash-line" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {displayFiles.map((file) => (
              <div
                key={file.name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '1rem',
                  alignItems: 'center',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div>
                  <strong>{file.name}</strong>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                    {formatBytes(file.size)} • {formatDate(file.timestamp)} •{' '}
                    <span style={{ color: getExpiryColor(file.timestamp) }}>
                      {getExpiresIn(file.timestamp)}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <a
                    className="btn btn-primary btn-icon"
                    href={`/downloads/${encodeURIComponent(file.name)}`}
                    download
                  >
                    <Icon icon="clarity:download-line" />
                  </a>
                  <button
                    className="btn btn-ghost btn-icon"
                    type="button"
                    onClick={() => onDelete(file.name)}
                    disabled={deleting[file.name]}
                  >
                    {deleting[file.name] ? '...' : <Icon icon="clarity:trash-line" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && totalPages > 1 ? (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          <button className="btn" type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>
            <Icon icon="clarity:rewind-line" />
          </button>
          <button className="btn" type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => prev - 1)}>
            <Icon icon="clarity:angle-line" style={{ transform: 'rotate(180deg)' }} />
          </button>
          <span className="status">
            Page {currentPage} of {totalPages}
          </span>
          <button className="btn" type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => prev + 1)}>
            <Icon icon="clarity:angle-line" />
          </button>
          <button className="btn" type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>
            <Icon icon="clarity:fast-forward-line" />
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default LibraryTab
