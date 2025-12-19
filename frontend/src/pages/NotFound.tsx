import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className="page" style={{ display: 'grid', placeItems: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <h1 style={{ fontSize: '6rem', margin: 0, opacity: 0.2 }}>404</h1>
        <h2>Page Not Found</h2>
        <p style={{ color: 'var(--muted)' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary">
          Go Home
        </Link>
      </div>
    </div>
  )
}

export default NotFound
