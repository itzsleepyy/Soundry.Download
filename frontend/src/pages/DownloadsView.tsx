import { useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import QueueTab from '../components/QueueTab'
import LibraryTab from '../components/LibraryTab'
import { useProgressTracker } from '../model/download'

const DownloadsView = () => {
  const progressTracker = useProgressTracker()
  const [activeTab, setActiveTab] = useState<'queue' | 'library'>('queue')

  const queueCount = useMemo(() => {
    return progressTracker.downloadQueue.filter((item) =>
      progressTracker.isSessionSong(item.song)
    ).length
  }, [progressTracker.downloadQueue])

  return (
    <div className="page">
      <Navbar />
      <div className="tab-row">
        <button
          className={activeTab === 'queue' ? 'tab active' : 'tab'}
          type="button"
          onClick={() => setActiveTab('queue')}
        >
          Session {queueCount ? <span className="badge" style={{ marginLeft: '0.5rem' }}>{queueCount}</span> : null}
        </button>
        <button
          className={activeTab === 'library' ? 'tab active' : 'tab'}
          type="button"
          onClick={() => setActiveTab('library')}
        >
          Library
        </button>
      </div>
      {activeTab === 'queue' ? <QueueTab /> : <LibraryTab />}
    </div>
  )
}

export default DownloadsView
