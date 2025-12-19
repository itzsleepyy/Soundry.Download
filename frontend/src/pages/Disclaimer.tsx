import { Link } from 'react-router-dom'

const Disclaimer = () => {
  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: '3rem' }}>
          <h1>Disclaimer</h1>
        </div>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <section>
            <h2>Copyright Notice</h2>
            <p>
              Soundry is a tool that facilitates downloading music from public platforms. The
              developers do not host, store, or distribute copyrighted content.
            </p>
          </section>
          <section>
            <h2>User Responsibility</h2>
            <p>Users are solely responsible for ensuring their use of Soundry complies with applicable laws and regulations. This includes:</p>
            <ul>
              <li>Copyright and intellectual property laws</li>
              <li>Terms of service of third-party platforms</li>
              <li>Local and international regulations</li>
            </ul>
          </section>
          <section>
            <h2>No Warranty</h2>
            <p>
              Soundry is provided without any warranty of any kind. The software may contain bugs or
              errors, and functionality is not guaranteed.
            </p>
          </section>
          <section>
            <h2>Support Artists</h2>
            <p>
              We strongly encourage users to support artists by purchasing music, attending concerts, and buying merchandise.
              Soundry is intended to help aspiring DJs access music for practice and education, not to replace legitimate purchases.
            </p>
          </section>
          <section className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <p>
              <strong>Important:</strong> By using Soundry, you acknowledge that you understand and accept
              full responsibility for your actions and their legal consequences.
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

export default Disclaimer
