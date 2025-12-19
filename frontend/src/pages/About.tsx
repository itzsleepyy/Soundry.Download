import { Link } from 'react-router-dom'

const About = () => {
  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: '3rem' }}>
          <h1>About</h1>
          <p style={{ color: 'var(--muted)' }}>
            Soundry empowers the next generation of DJs with accessible, high-quality music.
          </p>
        </div>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <section>
            <h2>Our Mission</h2>
            <p>
              Soundry provides high-quality music for free, breaking down the barriers that prevent
              aspiring DJs from entering the scene. With many newcomers entering the DJ world, services
              like Beatport can be prohibitively expensive.
            </p>
            <p>
              We understand this affects artists, but our goal is to encourage creativity and lower the
              entry barrier for passionate individuals who want to share music with the world.
            </p>
          </section>
          <section>
            <h2>Why We Built This</h2>
            <p>
              I personally struggled to access music when starting my DJing journey. The costs added up
              quickly, making it difficult to experiment and grow.
            </p>
            <p>
              Soundry was born from improving Downtify, transforming it into a modern, self-hosted
              application that anyone can run. I hope this tool helps others discover their passion and
              bring more creativity to the scene.
            </p>
            <p style={{ color: 'var(--muted)' }}>— Sleepy</p>
          </section>
          <section>
            <h2>What Makes It Special</h2>
            <ul>
              <li>Free & open source (MIT)</li>
              <li>High quality audio (FLAC, MP3)</li>
              <li>Multi-platform (Spotify, SoundCloud)</li>
              <li>Self-hosted & private</li>
            </ul>
          </section>
          <section className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <p>
              <strong>Note:</strong> Soundry is intended for personal, educational, and archival use.
              Please support artists by purchasing music when possible and respect copyright laws in your
              jurisdiction.
            </p>
          </section>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/" className="btn btn-primary">
              Start Downloading
            </Link>
            <a
              href="https://github.com/itzsleepyy/Soundry"
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About
