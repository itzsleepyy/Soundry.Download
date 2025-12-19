import { Icon } from '@iconify/react'
import { useSettingsManager } from '../model/settings'
import { useUI } from '../model/ui'

const SettingsModal = () => {
  const { settings, setSettings, settingsOptions, saveSettings, isSaved } =
    useSettingsManager()
  const { settingsOpen, closeSettings } = useUI()

  if (!settingsOpen) {
    return null
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 50,
      }}
      onClick={closeSettings}
    >
      <div
        className="card"
        style={{ width: 'min(480px, 92vw)', padding: '1.5rem', position: 'relative' }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="btn btn-ghost btn-icon"
          type="button"
          onClick={closeSettings}
          style={{ position: 'absolute', top: 12, right: 12 }}
        >
          <Icon icon="clarity:close-line" />
        </button>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>Settings</h3>
          <p style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>
            Configure your download preferences
          </p>
        </div>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
              Audio Provider
            </label>
            <select
              className="select"
              value={settings.audio_providers[0]}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  audio_providers: [event.target.value],
                }))
              }
            >
              {settingsOptions.audio_providers.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
              Lyrics Provider
            </label>
            <select
              className="select"
              value={settings.lyrics_providers[0]}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  lyrics_providers: [event.target.value],
                }))
              }
            >
              {settingsOptions.lyrics_providers.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
              Default Output Format
            </label>
            <select
              className="select"
              value={settings.format}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  format: event.target.value,
                }))
              }
            >
              {settingsOptions.format.map((format) => (
                <option key={format} value={format}>
                  {format}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div
          style={{
            marginTop: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
          }}
        >
          {isSaved === true ? (
            <span className="status success">
              <Icon icon="clarity:check-circle-line" /> Saved
            </span>
          ) : null}
          {isSaved === false ? (
            <span className="status" style={{ color: 'var(--error)' }}>
              <Icon icon="clarity:error-line" /> Error
            </span>
          ) : null}
          <button className="btn btn-ghost" type="button" onClick={closeSettings}>
            Cancel
          </button>
          <button className="btn btn-primary" type="button" onClick={saveSettings}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
