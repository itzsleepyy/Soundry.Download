import { Link } from 'react-router-dom'

const Terms = () => {
  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: '3rem' }}>
          <h1>Terms of Service</h1>
          <p style={{ color: 'var(--muted)' }}>Last updated: December 17, 2025</p>
        </div>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <section>
            <h2>Acceptance of Terms</h2>
            <p>
              By using Soundry, you agree to these terms. Soundry is provided "as-is" without any
              warranties.
            </p>
          </section>
          <section>
            <h2>License</h2>
            <p>
              Soundry is open-source software licensed under the MIT License. You are free to use,
              modify, and distribute the software in accordance with the license terms.
            </p>
          </section>
          <section>
            <h2>Proper Use</h2>
            <p>Soundry is intended for personal, educational, and archival purposes. You agree to:</p>
            <ul>
              <li>Respect copyright laws in your jurisdiction</li>
              <li>Support artists by purchasing music when possible</li>
              <li>Use the software responsibly and ethically</li>
              <li>Not use the software for commercial redistribution</li>
            </ul>
          </section>
          <section>
            <h2>Disclaimer of Liability</h2>
            <p>
              The developers of Soundry are not responsible for how you use the software. You assume all
              risks and legal responsibilities for your usage.
            </p>
          </section>
          <section>
            <h2>Changes to Terms</h2>
            <p>
              We may update these terms from time to time. Continued use of Soundry constitutes
              acceptance of updated terms.
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

export default Terms
