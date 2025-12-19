import { Icon } from '@iconify/react'
import SearchInput from './SearchInput'

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-icon">
        <Icon icon="clarity:music-note-line" />
      </div>
      <h1>Soundry</h1>
      <p className="hero-subtitle">Universal Cloud Audio Downloader</p>
      <div className="pills">
        <span className="pill">
          <Icon icon="mdi:spotify" /> Spotify
        </span>
        <span className="pill">
          <Icon icon="mdi:soundcloud" /> SoundCloud
        </span>
        <span className="pill">
          <Icon icon="simple-icons:youtubemusic" /> YouTube Music
        </span>
        <span className="pill">+ Many More</span>
      </div>
      <div style={{ width: '100%', marginTop: '1.5rem' }}>
        <SearchInput />
      </div>
    </section>
  )
}

export default Hero
