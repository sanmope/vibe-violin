import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/global.css'
import { initializeServices } from './services/ServiceFactory'
import { ServiceMode } from './types'

// Initialize services in MOCK mode for Phase 1
initializeServices(ServiceMode.MOCK)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
