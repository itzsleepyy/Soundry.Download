import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import SearchList from '../components/SearchList'
import { useSearchManager } from '../model/search'
import { useDownloadManager } from '../model/download'

const Search = () => {
  const { query } = useParams()
  const searchManager = useSearchManager()
  const downloadManager = useDownloadManager()

  useEffect(() => {
    if (query) {
      searchManager.searchFor(query)
    }
  }, [query])

  return (
    <div className="page">
      <Navbar />
      <SearchList
        data={searchManager.results}
        error={searchManager.error}
        onDownload={(song) => downloadManager.queue(song)}
      />
    </div>
  )
}

export default Search
