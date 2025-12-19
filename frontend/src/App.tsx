import { Navigate, Route, Routes } from 'react-router-dom'
import Front from './pages/Front'
import Search from './pages/Search'
import DownloadsView from './pages/DownloadsView'
import About from './pages/About'
import Changelog from './pages/Changelog'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Disclaimer from './pages/Disclaimer'
import NotFound from './pages/NotFound'
import SettingsModal from './components/SettingsModal'

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Front />} />
        <Route path="/search/:query" element={<Search />} />
        <Route path="/downloads" element={<DownloadsView />} />
        <Route path="/about" element={<About />} />
        <Route path="/changelog" element={<Changelog />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/list" element={<Navigate to="/downloads" replace />} />
        <Route path="/download" element={<Navigate to="/downloads" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <SettingsModal />
    </>
  )
}

export default App
