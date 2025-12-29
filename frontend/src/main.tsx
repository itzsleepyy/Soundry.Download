import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { DownloadProvider } from './lib/downloads'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <DownloadProvider>
        <App />
      </DownloadProvider>
    </BrowserRouter>
  </StrictMode>,
)
