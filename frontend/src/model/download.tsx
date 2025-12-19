import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import API from './api'
import type { DownloadItem, Song } from '../types'
import { useSettingsManager } from './settings'

export const STATUS = {
  QUEUED: 'In Queue',
  DOWNLOADING: 'Downloading...',
  DOWNLOADED: 'Done',
  ERROR: 'Error',
}

const createDownloadItem = (song: Song): DownloadItem => ({
  song,
  web_status: STATUS.QUEUED,
  progress: 0,
  message: '',
  web_download_url: null,
  timestamp: Date.now(),
})

const isQueued = (item: DownloadItem) => item.web_status === STATUS.QUEUED
const isDownloading = (item: DownloadItem) => item.web_status === STATUS.DOWNLOADING
const isDownloaded = (item: DownloadItem) => item.web_status === STATUS.DOWNLOADED
const isErrored = (item: DownloadItem) => item.web_status === STATUS.ERROR

type DownloadContextValue = {
  downloadQueue: DownloadItem[]
  loading: boolean
  fromURL: (url: string) => Promise<void>
  download: (song: Song) => void
  queue: (song: Song, beginDownload?: boolean) => void
  remove: (song: Song) => void
  getBySong: (song: Song) => DownloadItem | null
  isSessionSong: (song: Song) => boolean
}

const DownloadContext = createContext<DownloadContextValue | undefined>(undefined)

export const DownloadProvider = ({ children }: { children: React.ReactNode }) => {
  const [downloadQueue, setDownloadQueue] = useState<DownloadItem[]>([])
  const [loading, setLoading] = useState(false)
  const sessionSongIds = useRef(new Set<string>())
  const queueRef = useRef<DownloadItem[]>([])
  const { settings } = useSettingsManager()

  useEffect(() => {
    queueRef.current = downloadQueue
  }, [downloadQueue])

  const getBySong = (song: Song) => {
    return queueRef.current.find((item) => item.song.song_id === song.song_id) || null
  }

  const updateBySong = (songId: string, updater: (item: DownloadItem) => DownloadItem) => {
    setDownloadQueue((prev) =>
      prev.map((item) =>
        item.song.song_id === songId ? updater(item) : item
      )
    )
  }

  const appendSong = (song: Song) => {
    const item = createDownloadItem(song)
    setDownloadQueue((prev) => [...prev, item])
    sessionSongIds.current.add(song.song_id)
  }

  const removeSong = (song: Song) => {
    setDownloadQueue((prev) => prev.filter((item) => item.song.song_id !== song.song_id))
  }

  const isSessionSong = (song: Song) => sessionSongIds.current.has(song.song_id)

  const download = (song: Song) => {
    updateBySong(song.song_id, (item) => ({ ...item, web_status: STATUS.DOWNLOADING }))
    const format = settings.format || 'mp3'

    API.download(song.url, format)
      .then((res) => {
        if (res.status === 200) {
          const filename = res.data
          updateBySong(song.song_id, (item) => ({
            ...item,
            web_status: STATUS.DOWNLOADED,
            web_download_url: API.downloadFileURL(filename),
          }))
        } else {
          const msg = res.statusText || res.data?.message || 'Error'
          updateBySong(song.song_id, (item) => ({
            ...item,
            web_status: STATUS.ERROR,
            message: msg,
          }))
        }
      })
      .catch((err) => {
        const msg = err.response?.data?.message || err.message
        updateBySong(song.song_id, (item) => ({
          ...item,
          web_status: STATUS.ERROR,
          message: msg,
        }))
      })
  }

  const queue = (song: Song, beginDownload = false) => {
    appendSong(song)
    if (beginDownload) download(song)
  }

  const fromURL = async (url: string) => {
    const trimmed = url.trim()
    setLoading(true)

    if (
      trimmed.includes('soundcloud.com') ||
      trimmed.includes('snd.sc') ||
      trimmed.includes('youtube.com') ||
      trimmed.includes('youtu.be')
    ) {
      let name = trimmed
      try {
        const parts = trimmed.split('/')
        if (parts.length > 0) {
          name = parts[parts.length - 1].replace(/-/g, ' ')
        }
      } catch {
        name = trimmed
      }

      const dummySong: Song = {
        url: trimmed,
        name,
        artist: 'SoundCloud / YouTube',
        cover_url: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png',
        song_id: trimmed,
      }
      queue(dummySong, true)
      setLoading(false)
      return
    }

    return API.open(trimmed)
      .then((res) => {
        if (res.status === 200) {
          const songs = res.data
          if (Array.isArray(songs)) {
            songs.forEach((song) => queue(song, false))
          } else {
            queue(songs, false)
          }
        }
      })
      .catch((err) => {
        console.log('Open Error:', err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    API.ws_onmessage((event) => {
      const data = JSON.parse(event.data)
      if (!data?.song?.song_id) return
      updateBySong(data.song.song_id, (item) => ({
        ...item,
        progress: data.progress,
        message: data.message,
      }))
    })
    API.ws_onerror((event) => {
      console.log('websocket error:', event)
    })
  }, [])

  const value = useMemo(
    () => ({
      downloadQueue,
      loading,
      fromURL,
      download,
      queue,
      remove: removeSong,
      getBySong,
      isSessionSong,
    }),
    [downloadQueue, loading]
  )

  return <DownloadContext.Provider value={value}>{children}</DownloadContext.Provider>
}

export const useDownloadManager = () => {
  const ctx = useContext(DownloadContext)
  if (!ctx) {
    throw new Error('useDownloadManager must be used within DownloadProvider')
  }
  return ctx
}

export const useProgressTracker = () => {
  const ctx = useContext(DownloadContext)
  if (!ctx) {
    throw new Error('useProgressTracker must be used within DownloadProvider')
  }
  return ctx
}

export const downloadHelpers = {
  isQueued,
  isDownloading,
  isDownloaded,
  isErrored,
}
