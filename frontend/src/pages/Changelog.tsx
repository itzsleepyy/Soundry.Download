import { Link } from 'react-router-dom'

const Changelog = () => {
  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: '3rem' }}>
          <h1>Changelog</h1>
          <p style={{ color: 'var(--muted)' }}>Track the evolution of Soundry</p>
        </div>
        <div style={{ display: 'grid', gap: '2rem' }}>
          <section>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'baseline' }}>
              <h2>v2.1.0</h2>
              <span style={{ color: 'var(--accent)' }}>Latest</span>
              <span style={{ color: 'var(--muted)' }}>Dec 17, 2025</span>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <h4>Added</h4>
              <ul>
                <li>Library search with real-time filtering</li>
                <li>Pagination (50 items per page)</li>
                <li>About page</li>
                <li>Changelog page</li>
              </ul>
            </div>
          </section>
          <hr style={{ borderColor: 'var(--border)' }} />
          <section>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'baseline' }}>
              <h2>v2.0.0</h2>
              <span style={{ color: 'var(--muted)' }}>Dec 16, 2025</span>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <h4>Added</h4>
              <ul>
                <li>Session management with batch ZIP download</li>
                <li>Session-wide progress tracking</li>
                <li>24-hour auto-cleanup for downloads</li>
                <li>SoundCloud support</li>
                <li>Modern UI redesign (glassmorphism, grid/list views)</li>
                <li>Complete rebrand from Downtify to Soundry</li>
              </ul>
            </div>
            <div>
              <h4>Fixed</h4>
              <ul>
                <li>ZIP streaming corruption and performance</li>
                <li>SPA routing (404 on refresh)</li>
                <li>Coolify deployment compatibility</li>
              </ul>
            </div>
            <div>
              <h4>Changed</h4>
              <ul>
                <li>Multi-stage Dockerfile for self-contained builds</li>
                <li>Removed pytube dependency (yt-dlp only)</li>
              </ul>
            </div>
          </section>
          <div style={{ textAlign: 'center' }}>
            <Link to="/" className="btn btn-ghost">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Changelog
