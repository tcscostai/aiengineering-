import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ErrorBoundary } from './components/ui/ErrorBoundary.jsx'
import { seedPlatformData } from './services/seedService'

try {
  seedPlatformData()
} catch (err) {
  console.error('Platform seed failed (app will still load):', err)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
