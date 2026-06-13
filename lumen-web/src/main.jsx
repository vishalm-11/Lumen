import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Set Cesium base URL for assets (before Cesium is imported)
window.CESIUM_BASE_URL = '/cesium'

// Set Cesium token (only if available, don't fail if Cesium isn't loaded yet)
try {
  const cesiumToken = import.meta.env.VITE_CESIUM_TOKEN
  if (cesiumToken) {
    // Will be set when Cesium is actually imported in Globe component
    window.VITE_CESIUM_TOKEN = cesiumToken
  }
} catch (e) {
  console.warn('Could not set Cesium token:', e)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
