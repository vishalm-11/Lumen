import { useState } from 'react'
import { getMarkets } from '../lib/api'

const QUICK_ADD_COUNTRIES = [
  'United States',
  'China',
  'Japan',
  'Germany',
  'United Kingdom',
  'Saudi Arabia',
  'India',
]

export default function MarketsSidebar({ isOpen, onToggle, onCountryClick }) {
  const [addedMarkets, setAddedMarkets] = useState({})
  const [searchInput, setSearchInput] = useState('')
  const [addingCountry, setAddingCountry] = useState(null)

  const addMarket = async (countryName) => {
    if (addedMarkets[countryName] !== undefined) return
    setAddingCountry(countryName)
    try {
      const data = await getMarkets([countryName])
      setAddedMarkets(prev => ({ ...prev, [countryName]: data[countryName] }))
      setSearchInput('')
    } catch (e) {
      console.error('Failed to add market:', e)
    } finally {
      setAddingCountry(null)
    }
  }

  const removeMarket = (countryName) => {
    setAddedMarkets(prev => {
      const next = { ...prev }
      delete next[countryName]
      return next
    })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchInput.trim()) {
      e.preventDefault()
      addMarket(searchInput.trim())
    }
  }

  const sortedMarkets = Object.entries(addedMarkets)
    .map(([country, data]) => ({ country, ...data }))
    .sort((a, b) => Math.abs(b.change_pct || 0) - Math.abs(a.change_pct || 0))

  return (
    <>
      {/* Toggle button - always visible */}
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          top: '50%',
          right: isOpen ? '25%' : 0,
          transform: 'translateY(-50%)',
          zIndex: 100,
          width: '32px',
          height: '80px',
          background: 'rgba(0,0,0,0.85)',
          border: '1px solid rgba(16,185,129,0.9)',
          borderRight: 'none',
          borderRadius: '8px 0 0 8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'JetBrains Mono',
          fontSize: '0.6rem',
          color: '#10B981',
          letterSpacing: '0.15em',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          transition: 'right 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(16,185,129,0.15)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0,0,0,0.85)'
        }}
      >
        MARKETS
      </button>

      {/* Sidebar panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: isOpen ? '25%' : 0,
        height: '100vh',
        overflow: 'hidden',
        transition: 'width 0.3s ease',
        zIndex: 5,
      }}>
        <div style={{
          width: '100%',
          minWidth: 0,
          height: '100%',
          background: 'rgba(0,0,0,0.92)',
          backdropFilter: 'blur(20px)',
          borderLeft: '2px solid rgba(156,163,175,0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '22px 16px 16px',
            borderBottom: '2px solid rgba(156,163,175,0.35)',
            flexShrink: 0,
          }}>
            <div style={{
              fontFamily: 'JetBrains Mono',
              fontSize: '0.75rem',
              color: '#10B981',
              letterSpacing: '0.2em',
              marginBottom: '12px',
            }}>
              LIVE MARKETS
            </div>

            {/* Add market input */}
            <input
              type="text"
              placeholder="Add a market... (e.g. United States, Iran)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#F9FAFB',
                fontFamily: 'DM Sans',
                fontSize: '0.82rem',
                outline: 'none',
                marginBottom: '10px',
              }}
            />

            {/* Quick-add chips */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {QUICK_ADD_COUNTRIES.map((country) => {
                const isAdded = addedMarkets[country] !== undefined
                const isAdding = addingCountry === country
                return (
                  <button
                    key={country}
                    onClick={() => !isAdded && !isAdding && addMarket(country)}
                    disabled={isAdded || isAdding}
                    style={{
                      padding: '6px 12px',
                      background: isAdded ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isAdded ? 'rgba(16,185,129,0.9)' : 'rgba(255,255,255,0.10)'}`,
                      borderRadius: '6px',
                      color: isAdded ? '#10B981' : '#9CA3AF',
                      fontFamily: 'DM Sans',
                      fontSize: '0.7rem',
                      whiteSpace: 'nowrap',
                      cursor: isAdded || isAdding ? 'default' : 'pointer',
                      opacity: isAdding ? 0.6 : 1,
                    }}
                  >
                    {isAdding ? '...' : country}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Markets list */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 0',
          }}>
            {sortedMarkets.length === 0 ? (
              <div style={{
                padding: '40px 24px',
                textAlign: 'center',
                color: '#6B7280',
                fontFamily: 'DM Sans',
                fontSize: '0.85rem',
              }}>
                Add markets above to track them
              </div>
            ) : (
              sortedMarkets.map((market) => {
                const hasData = market.index_name != null && market.value != null
                const isPositive = (market.change_pct || 0) >= 0
                const changeColor = isPositive ? '#10B981' : '#EF4444'

                return (
                  <div
                    key={market.country}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      position: 'relative',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (hasData) e.currentTarget.style.background = 'rgba(255,255,255,0.035)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); removeMarket(market.country) }}
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        background: 'transparent',
                        border: 'none',
                        color: '#6B7280',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        padding: '4px',
                        lineHeight: 1,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#EF4444'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#6B7280'
                      }}
                      aria-label={`Remove ${market.country}`}
                      title="Remove"
                    >
                      ✕
                    </button>
                    <div
                      onClick={() => hasData && onCountryClick && onCountryClick(market.country)}
                      style={{
                        minWidth: 0,
                        cursor: hasData ? 'pointer' : 'default',
                        paddingRight: '26px', // space for remove button
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{
                            fontFamily: 'DM Sans',
                            fontSize: '0.82rem',
                            color: '#F9FAFB',
                            fontWeight: '500',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {market.country}
                          </div>
                          <div style={{
                            fontFamily: 'JetBrains Mono',
                            fontSize: '0.6rem',
                            color: '#9CA3AF',
                            marginTop: '6px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {market.index_name || 'No index data'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                          {hasData && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontFamily: 'JetBrains Mono',
                              fontSize: '0.68rem',
                              color: changeColor,
                              fontWeight: '600',
                            }}>
                              <span>{isPositive ? '↑' : '↓'}</span>
                              <span>{Math.abs(market.change_pct || 0).toFixed(2)}%</span>
                            </div>
                          )}
                          <div style={{
                            fontFamily: 'JetBrains Mono',
                            fontSize: '0.72rem',
                            color: '#E5E7EB',
                            textAlign: 'right',
                          }}>
                            {market.value || '—'}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        fontFamily: 'JetBrains Mono',
                        fontSize: '0.62rem',
                        color: 'rgba(16,185,129,0.55)',
                        marginTop: '8px',
                      }}>
                        {hasData ? 'Click for briefing →' : ''}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </>
  )
}
