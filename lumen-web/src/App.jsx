import { useState, useEffect } from 'react'
import Globe from './components/Globe'
import CountryPanel from './components/CountryPanel'
import LoadingOverlay from './components/LoadingOverlay'
import LandingPage from './components/LandingPage'
import { getCountryData } from './lib/api'
import { API_URL } from './config'

export default function App() {
  const [showGlobe, setShowGlobe] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Keep Railway backend alive
  useEffect(() => {
    const keepAlive = () => {
      fetch(`${API_URL}/health`)
        .catch(() => {}) // silently fail
    }
    keepAlive() // ping immediately on load
    const interval = setInterval(keepAlive, 4 * 60 * 1000) // every 4 minutes
    return () => clearInterval(interval)
  }, [])

  const handleCountryClick = async (countryName) => {
    if (loading) return
    console.log('handleCountryClick called with:', countryName)
    setLoading(true)
    setError(null)
    setSelectedCountry(null)
    try {
      console.log('Fetching country data for:', countryName)
      const data = await getCountryData(countryName)
      console.log('Country data received:', data)
      setSelectedCountry(data)
    } catch (e) {
      console.error('Error fetching country data:', e)
      const errorMessage = e.response?.data?.detail || e.message || 'Unknown error'
      setError(`Could not load data for ${countryName}: ${errorMessage}`)
      console.error('Full error:', e.response?.data || e)
    } finally {
      setLoading(false)
    }
  }

  // Show landing page first
  if (!showGlobe) {
    return <LandingPage onEnter={() => setShowGlobe(true)} />
  }

  const globeWidth = '100%'

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#0a0f1e', display: 'flex' }}>
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: globeWidth, zIndex: 10,
        padding: '20px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(to bottom, rgba(10,15,30,0.9) 0%, transparent 100%)',
        pointerEvents: 'none',
        transition: 'width 0.3s ease',
      }}>
        <div>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: '2rem', letterSpacing: '0.1em', color: '#FFFFFF' }}>
            LUMEN
          </div>
          <div style={{ fontFamily: 'DM Sans', fontSize: '0.65rem', fontWeight: 500, color: '#6B7280', letterSpacing: '0.2em', marginTop: '-4px' }}>
            See It. Understand It. Act.
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'DM Sans', fontSize: '0.65rem', fontWeight: 500, color: '#6B7280', letterSpacing: '0.15em' }}>
            CLICK ANY COUNTRY
          </div>
          <div style={{ fontFamily: 'DM Sans', fontSize: '0.6rem', fontWeight: 500, color: '#6B7280', letterSpacing: '0.12em', marginTop: '5px' }}>
            Zoom to Find More Countries
          </div>
        </div>
      </div>

      {/* Globe container - includes globe + loading overlay (centered relative to globe only) */}
      <div style={{
        width: globeWidth,
        height: '100vh',
        position: 'relative',
        transition: 'width 0.3s ease',
      }}>
        <Globe onCountryClick={handleCountryClick} />
        {loading && <LoadingOverlay />}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#FCA5A5', padding: '10px 20px', borderRadius: '6px',
          fontFamily: 'DM Sans', fontSize: '0.75rem', fontWeight: 500, zIndex: 20
        }}>
          {error}
        </div>
      )}

      {/* Country Panel - slides over globe only, not sidebar */}
      {selectedCountry && (
        <CountryPanel
          data={selectedCountry}
          onClose={() => setSelectedCountry(null)}
          globeWidth={globeWidth}
        />
      )}
    </div>
  )
}
