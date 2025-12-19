import { Icon } from '@iconify/react'
import { useNavigate, useLocation } from 'react-router-dom'
import SoundryLogo from './SoundryLogo'
import { useBinaryThemeManager } from '../model/theme'
import { useProgressTracker } from '../model/download'
import { useSearchManager } from '../model/search'
import { useUI } from '../model/ui'

const NavbarFront = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { switchTheme, currentTheme } = useBinaryThemeManager()
  const { downloadQueue } = useProgressTracker()
  const { searchTerm } = useSearchManager()
  const { openSettings } = useUI()

  const isDownloads = location.pathname.startsWith('/downloads')

  return (
    <header className="topbar">
      <button
        className="brand-mark"
        type="button"
        onClick={() => navigate('/')}
        aria-label="Soundry home"
      >
        <SoundryLogo className="brand-icon" />
      </button>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', position: 'relative' }}>
        <button className="icon-button" type="button" onClick={switchTheme}>
          <Icon icon={currentTheme === 'dark' ? 'clarity:moon-line' : 'clarity:sun-line'} />
        </button>
        <button className="icon-button" type="button" onClick={openSettings}>
          <Icon icon="clarity:settings-line" />
        </button>
        <button
          className={isDownloads || downloadQueue.length ? 'icon-button accent' : 'icon-button'}
          type="button"
          onClick={() =>
            isDownloads
              ? navigate(`/search/${encodeURIComponent(searchTerm || ' ')}`)
              : navigate('/downloads')
          }
        >
          <Icon icon="clarity:download-cloud-line" />
        </button>
        {downloadQueue.length > 0 ? (
          <span className="badge" style={{ position: 'absolute', top: -6, right: -2 }}>
            {downloadQueue.length}
          </span>
        ) : null}
      </div>
    </header>
  )
}

export default NavbarFront
