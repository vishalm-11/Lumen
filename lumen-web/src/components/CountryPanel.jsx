import { useEffect, useRef, useState } from 'react'

// Article Preview Component
const ArticlePreview = ({ headline, index }) => {
  const [showPreview, setShowPreview] = useState(false)
  const [previewPosition, setPreviewPosition] = useState('right')
  const articleRef = useRef(null)
  const headlineText = typeof headline === 'string' ? headline : (headline?.title || headline || '')
  const headlineUrl = typeof headline === 'object' && headline ? headline.url : null
  const headlineImage = typeof headline === 'object' && headline ? headline.image : null
  const headlineDescription = typeof headline === 'object' && headline ? headline.description : null

  const handleMouseEnter = () => {
    if (headlineDescription && articleRef.current) {
      const rect = articleRef.current.getBoundingClientRect()
      const spaceRight = window.innerWidth - rect.right
      // If there's not enough space on the right (280px + 12px margin), show on left
      setPreviewPosition(spaceRight < 300 ? 'left' : 'right')
      setShowPreview(true)
    }
  }

  return (
    <div 
      ref={articleRef}
      style={{
        padding: '14px 16px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        display: 'flex',
        gap: '14px',
        alignItems: 'flex-start',
        transition: 'all 0.2s ease',
        cursor: headlineUrl ? 'pointer' : 'default',
        position: 'relative',
      }}
      onClick={() => {
        if (headlineUrl) {
          window.open(headlineUrl, '_blank', 'noopener,noreferrer')
        }
      }}
      onMouseEnter={(e) => {
        if (headlineUrl) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
        }
        handleMouseEnter()
      }}
      onMouseLeave={(e) => {
        if (headlineUrl) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
        }
        setShowPreview(false)
      }}
    >
      {/* Thumbnail */}
      {headlineImage && (
        <img 
          src={headlineImage} 
          alt=""
          style={{
            width: '80px',
            height: '60px',
            objectFit: 'cover',
            borderRadius: '6px',
            flexShrink: 0,
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      )}
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{
            fontFamily: 'JetBrains Mono',
            fontSize: '0.6rem',
            color: '#FFFFFF',
            flexShrink: 0,
            marginTop: '2px',
          }}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <span style={{
            fontFamily: 'DM Sans',
            fontSize: '0.82rem',
            lineHeight: 1.5,
            color: headlineUrl ? '#FFFFFF' : 'rgba(249,250,251,0.75)',
            textDecoration: headlineUrl ? 'underline' : 'none',
            textUnderlineOffset: '2px',
          }}>
            {headlineText}
          </span>
        </div>
        {headlineUrl && (
          <div style={{
            fontFamily: 'JetBrains Mono',
            fontSize: '0.55rem',
            color: '#6B7280',
            marginLeft: '24px',
            opacity: 0.7,
          }}>
            Click to read →
          </div>
        )}
      </div>
      
      {/* Hover Preview */}
      {showPreview && headlineDescription && (
        <div style={{
          position: 'absolute',
          ...(previewPosition === 'right' 
            ? { left: '100%', marginLeft: '12px' }
            : { right: '100%', marginRight: '12px' }
          ),
          top: '0',
          width: '280px',
          padding: '14px 16px',
          background: 'rgba(0,0,0,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          zIndex: 100,
          pointerEvents: 'none',
        }}>
          <div style={{
            fontFamily: 'DM Sans',
            fontSize: '0.75rem',
            lineHeight: 1.6,
            color: 'rgba(249,250,251,0.9)',
          }}>
            {headlineDescription}
          </div>
        </div>
      )}
    </div>
  )
}


export default function CountryPanel({ data, onClose, globeWidth = '75%' }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (!data?.audio_base64) {
      console.log('[Audio] No audio_base64 in data:', Object.keys(data || {}))
      return
    }
    console.log('[Audio] Playing audio, base64 length:', data.audio_base64.length)
    const audio = new Audio(`data:audio/mpeg;base64,${data.audio_base64}`)
    audioRef.current = audio
    audio.onplay = () => setIsPlaying(true)
    audio.onended = () => setIsPlaying(false)
    audio.onpause = () => setIsPlaying(false)
    audio.onerror = (e) => console.error('[Audio] Playback error:', e)
    setTimeout(() => {
      audio.play().catch(e => console.error('[Audio] Play failed:', e))
    }, 300)
    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [data])

  const toggleAudio = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.currentTime = 0
      audioRef.current.play()
    }
  }

  return (
    <>
      {/* Backdrop overlay - clickable to close, only over globe area */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: globeWidth,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 19,
        }}
      />
      
      {/* Panel positioned over globe only */}
      <div className="fade-in" style={{
        position: 'fixed',
        top: '50%',
        left: `calc(${globeWidth} / 2)`,
        transform: 'translate(-50%, -50%)',
        width: '600px',
        maxWidth: '60vw',
        maxHeight: '85vh',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        pointerEvents: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '28px 28px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{
              fontFamily: 'JetBrains Mono',
              fontSize: '0.6rem',
              color: '#FFFFFF',
              letterSpacing: '0.2em',
              marginBottom: '6px',
            }}>
              HUMANITARIAN BRIEFING
            </div>
            <div style={{
              fontFamily: 'Bebas Neue',
              fontSize: '2.2rem',
              letterSpacing: '0.05em',
              color: '#F9FAFB',
              lineHeight: 1,
            }}>
              {data.country.toUpperCase()}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#FFFFFF',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
            }}
          >
            ✕
          </button>
        </div>

        {/* Audio Player */}
        <div style={{
          margin: '16px 28px',
          padding: '14px 18px',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }} 
        onClick={toggleAudio}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
        }}
        >
          {/* ON AIR indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <div className={isPlaying ? 'pulse-dot' : ''} style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isPlaying ? '#10B981' : '#6B7280',
            }} />
            <span style={{
              fontFamily: 'JetBrains Mono',
              fontSize: '0.6rem',
              letterSpacing: '0.15em',
              color: isPlaying ? '#10B981' : '#6B7280',
            }}>
              {isPlaying ? 'ON AIR' : 'PLAY'}
            </span>
          </div>

          {/* Waveform bars (decorative) */}
          <div style={{ display: 'flex', gap: '2px', alignItems: 'center', flex: 1 }}>
            {[...Array(20)].map((_, i) => (
              <div key={i} style={{
                width: '2px',
                height: `${isPlaying ? Math.random() * 16 + 4 : 4}px`,
                background: isPlaying ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
                borderRadius: '1px',
                transition: 'height 0.1s ease',
              }} />
            ))}
          </div>

          <span style={{
            fontFamily: 'JetBrains Mono',
            fontSize: '0.65rem',
            color: '#FFFFFF',
            flexShrink: 0,
          }}>
            {isPlaying ? '⏸' : '▶'}
          </span>
        </div>

        {/* Scrollable Content Container */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Summary */}
          <div style={{ padding: '0 28px 20px' }}>
            <div style={{
              fontFamily: 'DM Sans',
              fontSize: '0.95rem',
              lineHeight: 1.75,
              color: 'rgba(249,250,251,0.95)',
              fontWeight: '400',
            }}>
              {data.summary}
            </div>
          </div>

          {/* Donate Button */}
          {data.cause && (
            <div style={{ padding: '0 28px 24px' }}>
              <a
                href={data.cause.donationUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '10px',
                  color: '#F9FAFB',
                  fontFamily: 'DM Sans',
                  fontSize: '0.88rem',
                  fontWeight: '500',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                }}
              >
                Donate to {data.cause.organization} →
              </a>
            </div>
          )}

          {/* Headlines */}
          <div style={{
            padding: '0 28px 28px',
          }}>
            <div style={{
              fontFamily: 'JetBrains Mono',
              fontSize: '0.65rem',
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '0.25em',
              marginBottom: '16px',
              fontWeight: '500',
            }}>
              RELATED COVERAGE
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.headlines && data.headlines.length > 0 ? (
                data.headlines.map((headline, i) => (
                  <ArticlePreview key={i} headline={headline} index={i} />
                ))
              ) : (
                <div style={{
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  fontFamily: 'DM Sans',
                  fontSize: '0.82rem',
                  color: 'rgba(249,250,251,0.75)',
                }}>
                  No headlines available at this time.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
