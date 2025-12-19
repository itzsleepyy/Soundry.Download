import { Link } from 'react-router-dom'

const Privacy = () => {
  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: '3rem' }}>
          <h1>Privacy Policy</h1>
          <p style={{ color: 'var(--muted)' }}>Last updated: December 17, 2025</p>
        </div>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <section>
            <h2>Overview</h2>
            <p>
              Soundry is a self-hosted application. When you run Soundry on your own server, you have
              complete control over your data. We (the developers) do not collect, store, or have access
              to any of your personal information or usage data.
            </p>
          </section>
          <section>
            <h2>Data Collection</h2>
            <p>
              Soundry does not collect any personal data. All downloads, searches, and user preferences
              are stored locally on your server.
            </p>
            <ul>
              <li>No tracking or analytics</li>
              <li>No user accounts or authentication required</li>
              <li>No data is sent to external servers (except to download music from third-party platforms)</li>
            </ul>
          </section>
          <section>
            <h2>Third-Party Services</h2>
            <p>
              Soundry connects to third-party services (Spotify, SoundCloud, YouTube) to download music.
              These services may have their own privacy policies and terms of service.
            </p>
          </section>
          <section>
            <h2>Your Responsibility</h2>
            <p>
              As a self-hosted application, you are responsible for managing your own server security,
              backups, and data retention policies.
            </p>
          </section>
          <div>
            <Link to="/" className="btn btn-ghost">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Privacy
