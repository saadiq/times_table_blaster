import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { getDB } from './storage/db'

// Pre-warm IndexedDB - starts initialization before React mounts
// This runs in parallel with React setup, reducing perceived startup time
getDB()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
