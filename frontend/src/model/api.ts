import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import config from '../config'

const API = axios.create({
  baseURL: `${config.PROTOCOL}//${config.BACKEND}:${config.PORT}${config.BASEURL}`,
})

const sessionID = uuidv4()

const wsConnection = new WebSocket(
  `${config.WS_PROTOCOL}//${config.BACKEND}${
    config.PORT !== '' ? ':' + config.PORT : ''
  }${config.BASEURL}/api/ws?client_id=${sessionID}`
)

wsConnection.onopen = (event) => {
  console.log('websocket connection opened', event)
}

function getVersion() {
  return API.get('/api/version')
    .then((res) => {
      const prevItem = localStorage.getItem('version')
      localStorage.setItem('version', res.data)
      if (prevItem !== res.data) {
        location.reload()
      }
    })
    .catch((error) => {
      console.error(error)
      localStorage.setItem('version', '0.0.0')
    })
}

getVersion()

function search(query: string) {
  return API.get('/api/songs/search', { params: { query } })
}

function open(songURL: string) {
  if (localStorage.getItem('version') >= '4') {
    return API.get('/api/url', { params: { url: songURL } })
  }
  return API.get('/api/song/url', { params: { url: songURL } })
}

function download(songURL: string, format = 'mp3') {
  if (
    songURL &&
    (songURL.includes('soundcloud.com') ||
      songURL.includes('snd.sc') ||
      songURL.includes('youtube.com') ||
      songURL.includes('youtu.be'))
  ) {
    return API.post('/api/download/soundcloud', null, {
      params: { url: songURL, client_id: sessionID, format },
    })
  }

  return API.post('/api/download/url', null, {
    params: { url: songURL, client_id: sessionID, format },
  })
}

function checkForUpdate() {
  return API.get('/api/check_update')
}

function downloadFileURL(fileName: string) {
  return `/downloads/${encodeURIComponent(fileName)}`
}

function listDownloads() {
  return API.get('/list')
}

function deleteDownload(file: string) {
  return API.delete('/delete', { params: { file } })
}

function downloadZip(files: string[]) {
  return API.post('/api/download/zip', { files }, { responseType: 'blob' })
}

function getSettings() {
  return API.get('/api/settings', { params: { client_id: sessionID } })
}

function setSettings(settings: unknown) {
  return API.post('/api/settings/update', settings, {
    params: { client_id: sessionID },
  })
}

function ws_onmessage(fn: (event: MessageEvent) => void) {
  wsConnection.onmessage = fn
}

function ws_onerror(fn: (event: Event) => void) {
  wsConnection.onerror = fn
}

export default {
  search,
  open,
  download,
  downloadFileURL,
  listDownloads,
  deleteDownload,
  downloadZip,
  getSettings,
  setSettings,
  checkForUpdate,
  ws_onmessage,
  ws_onerror,
  getVersion,
}
