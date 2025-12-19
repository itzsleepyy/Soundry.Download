export type Song = {
  song_id: string
  name: string
  url: string
  artist?: string
  artists?: string[]
  album_name?: string
  cover_url: string
  explicit?: boolean
}

export type DownloadItem = {
  song: Song
  web_status: string
  progress: number
  message: string
  web_download_url: string | null
  timestamp: number
}
