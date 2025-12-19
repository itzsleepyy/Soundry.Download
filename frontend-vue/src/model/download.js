import { ref, computed } from 'vue'

import API from '/src/model/api'

const STATUS = {
  QUEUED: 'In Queue',
  DOWNLOADING: 'Downloading...',
  DOWNLOADED: 'Done',
  ERROR: 'Error',
}

const downloadQueue = ref([])

class DownloadItem {
  constructor(song) {
    this.song = song
    this.web_status = STATUS.QUEUED
    this.progress = 0
    this.message = ''
    this.web_download_url = null
    this.timestamp = Date.now()
  }
  setDownloading() {
    this.web_status = STATUS.DOWNLOADING
  }
  setDownloaded() {
    this.web_status = STATUS.DOWNLOADED
  }
  setError(msg) {
    this.web_status = STATUS.ERROR
    if (msg) this.message = msg
  }
  setWebURL(URL) {
    this.web_download_url = URL
  }
  isQueued() {
    return this.web_status === STATUS.QUEUED
  }
  isDownloading() {
    return this.web_status === STATUS.DOWNLOADING
  }
  isDownloaded() {
    return this.web_status === STATUS.DOWNLOADED
  }
  isErrored() {
    return this.web_status === STATUS.ERROR
  }
  wsUpdate(message) {
    this.progress = message.progress
    this.message = message.message
  }
}

const sessionSongIds = new Set()

export function useProgressTracker() {

  function _findIndex(song) {
    return downloadQueue.value.findIndex(
      (downloadItem) => downloadItem.song.song_id === song.song_id
    )
  }
  function appendSong(song) {
    let downloadItem = new DownloadItem(song)
    downloadQueue.value.push(downloadItem)
    sessionSongIds.add(song.song_id)
  }
  function removeSong(song) {
    console.log('removing', song, song.song_id)
    downloadQueue.value = downloadQueue.value.filter(
      (downloadItem) => downloadItem.song.song_id !== song.song_id
    )
    console.log(downloadQueue.value)
  }

  function getBySong(song) {
    const idx = _findIndex(song)
    if (idx === -1) return null
    return downloadQueue.value[_findIndex(song)]
  }

  function isSessionSong(song) {
    return sessionSongIds.has(song.song_id)
  }

  return {
    appendSong,
    removeSong,
    getBySong,
    isSessionSong,
    downloadQueue,
  }
}

const progressTracker = useProgressTracker()

// If Websocket connection exists, set status using descriptive events, else, fallback to simple messages.
API.ws_onmessage((event) => {
  // event: MessageEvent
  let data = JSON.parse(event.data)
  progressTracker.getBySong(data.song).wsUpdate(data)
})
API.ws_onerror((event) => {
  // event: MessageEvent
  console.log('websocket error:', event)
})

import { useSettingsManager } from './settings'

const sm = useSettingsManager()

export function useDownloadManager() {
  const loading = ref(false)
  function fromURL(url) {
    url = url.trim()
    console.log('fromURL called with:', url)
    loading.value = true

    // SoundCloud / YouTube Direct Support
    if (url.includes('soundcloud.com') || url.includes('snd.sc') || url.includes('youtube.com') || url.includes('youtu.be')) {
      // Attempt to extract a readable name from URL
      let name = url;
      try {
        const parts = url.split('/');
        if (parts.length > 0) name = parts[parts.length - 1].replace(/-/g, ' ');
      } catch (e) { }

      const dummySong = {
        url: url,
        name: name,
        artist: 'SoundCloud / YouTube',
        cover_url: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png', // Generic or specific icon
        song_id: url
      }
      queue(dummySong, true)
      loading.value = false
      return Promise.resolve()
    }

    return API.open(url)
      .then((res) => {
        console.log('Received Response:', res)
        if (res.status === 200) {
          const songs = res.data
          if (Array.isArray(songs)) {
            for (const song of songs) {
              console.log('Opened Song:', song)
              queue(song, false)
            }
          } else {
            console.log('Opened Song:', songs)
            queue(songs, false)
          }
        } else {
          console.log('Error:', res)
        }
      })
      .catch((err) => {
        console.log('Other Error:', err.message)
      })
      .finally(() => {
        loading.value = false
      })
  }

  function download(song) {
    console.log('Downloading', song)
    progressTracker.getBySong(song).setDownloading()

    // Get current format
    const format = sm.settings.value.format || 'mp3'

    API.download(song.url, format)
      .then((res) => {
        console.log('Received Response:', res)
        if (res.status === 200) {
          let filename = res.data
          console.log('Download Complete:', filename)
          progressTracker
            .getBySong(song)
            .setWebURL(API.downloadFileURL(filename))
          progressTracker.getBySong(song).setDownloaded()
        } else {
          console.log('Error:', res)
          let msg = res.statusText || 'Error'
          if (res.data && res.data.message) msg = res.data.message
          progressTracker.getBySong(song).setError(msg)
        }
      })
      .catch((err) => {
        let msg = err.message
        if (err.response && err.response.data && err.response.data.message) {
          msg = err.response.data.message
        }
        console.log('Download Error:', msg)
        progressTracker.getBySong(song).setError(msg)
      })
  }

  function queue(song, beginDownload = false) {
    progressTracker.appendSong(song)
    if (beginDownload) download(song)
  }
  function remove(song) {
    console.log('removing')
    progressTracker.removeSong(song)
  }

  return {
    fromURL,
    download,
    queue,
    remove,
    loading,
  }
}
