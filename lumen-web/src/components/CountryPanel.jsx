import { useEffect, useRef, useState, useCallback } from 'react'
import { getYoutubeVideo } from '../lib/api'
import HolographicProjection from './HolographicProjection'

export default function CountryPanel({ data, onClose, globeWidth = '75%' }) {
  const audioRef = useRef(null)
  const playTimeoutRef = useRef(null)
  const layoutRef = useRef(null)
  const panelRef = useRef(null)
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoId, setVideoId] = useState(null)
  const [videoVisible, setVideoVisible] = useState(false)

  const handleLinesComplete = useCallback(() => {
    setVideoVisible(true)
  }, [])

  const stopAudio = () => {
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current)
      playTimeoutRef.current = null
    }

    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
      audio.onplay = null
      audio.onended = null
      audio.onpause = null
      audio.onerror = null
      audio.removeAttribute('src')
      audio.load()
      audioRef.current = null
    }

    setIsPlaying(false)
  }

  const handleClose = () => {
    stopAudio()
    onClose()
  }

  useEffect(() => {
    stopAudio()

    if (!data?.audio_base64) {
      return
    }

    const audio = new Audio(`data:audio/mpeg;base64,${data.audio_base64}`)
    audioRef.current = audio

    audio.onplay = () => setIsPlaying(true)
    audio.onended = () => {
      setIsPlaying(false)
      audio.currentTime = 0
    }
    audio.onpause = () => setIsPlaying(false)
    audio.onerror = () => setIsPlaying(false)

    playTimeoutRef.current = setTimeout(() => {
      playTimeoutRef.current = null
      if (audioRef.current !== audio) return
      audio.play().catch(() => setIsPlaying(false))
    }, 300)

    return () => {
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current)
        playTimeoutRef.current = null
      }

      if (audioRef.current === audio) {
        audio.pause()
        audio.currentTime = 0
        audio.onplay = null
        audio.onended = null
        audio.onpause = null
        audio.onerror = null
        audio.removeAttribute('src')
        audio.load()
        audioRef.current = null
      }

      setIsPlaying(false)
    }
  }, [data?.country, data?.audio_base64])

  useEffect(() => {
    let cancelled = false
    setVideoId(null)
    setVideoVisible(false)

    getYoutubeVideo(data.country, data.cause?.issue)
      .then((res) => {
        if (!cancelled) setVideoId(res.video_id)
      })
      .catch(() => {
        if (!cancelled) setVideoId(null)
      })

    return () => {
      cancelled = true
    }
  }, [data.country, data.cause?.issue])

  useEffect(() => {
    if (!videoId) return
    const mq = window.matchMedia('(max-width: 900px)')
    if (mq.matches) setVideoVisible(true)
  }, [videoId])

  const toggleAudio = () => {
    const audio = audioRef.current
    if (!audio) return

    if (!audio.paused) {
      audio.pause()
      return
    }

    if (audio.ended) {
      audio.currentTime = 0
    }

    audio.play().catch(() => setIsPlaying(false))
  }

  return (
    <>
      {/* Backdrop overlay - clickable to close, only over globe area */}
      <div 
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: globeWidth,
          bottom: 0,
          background: 'rgba(20, 10, 5, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 19,
        }}
      />
      
      {/* Briefing layout — centered, holographic video projection */}
      <div className="briefing-layout" ref={layoutRef}>
        {videoId && (
          <HolographicProjection
            layoutRef={layoutRef}
            panelRef={panelRef}
            videoRef={videoRef}
            active={!!videoId}
            onLinesComplete={handleLinesComplete}
          />
        )}
        <div className="briefing-panel" ref={panelRef}>
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
              fontFamily: 'DM Sans',
            fontWeight: 500,
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
            onClick={handleClose}
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
              background: isPlaying ? '#F59E0B' : '#6B7280',
            }} />
            <span style={{
              fontFamily: 'DM Sans',
            fontWeight: 500,
              fontSize: '0.6rem',
              letterSpacing: '0.15em',
              color: isPlaying ? '#F59E0B' : '#6B7280',
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
            fontFamily: 'DM Sans',
            fontWeight: 500,
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

          {/* Key Stats */}
          {data.key_stats?.length > 0 && (
            <div style={{ padding: '0 28px 24px' }}>
              <div style={{
                fontFamily: 'DM Sans',
                fontWeight: 500,
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '0.25em',
                marginBottom: '12px',
              }}>
                KEY STATS
              </div>
              <div style={{
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
              }}>
                {data.key_stats.map((stat, i) => (
                  <div
                    key={i}
                    style={{
                      flex: '1 1 140px',
                      padding: '14px 16px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    <div style={{
                      fontFamily: 'DM Sans',
                      fontSize: '1.35rem',
                      fontWeight: 600,
                      color: '#F59E0B',
                      lineHeight: 1.2,
                      marginBottom: '6px',
                    }}>
                      {stat.value}
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans',
                      fontSize: '0.75rem',
                      lineHeight: 1.4,
                      color: 'rgba(249,250,251,0.65)',
                    }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Donate Button */}
          {data.cause && (
            <div style={{ padding: '0 28px 28px' }}>
              <a
                href={data.cause.donationUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.45)',
                  borderRadius: '10px',
                  color: '#FCD34D',
                  fontFamily: 'DM Sans',
                  fontSize: '0.88rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.28)'
                  e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.65)'
                  e.currentTarget.style.color = '#FDE68A'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)'
                  e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.45)'
                  e.currentTarget.style.color = '#FCD34D'
                }}
              >
                Donate to {data.cause.organization} →
              </a>
            </div>
          )}

        </div>
        </div>

        {videoId && (
          <div className="briefing-video-wrapper">
            <div
              ref={videoRef}
              className={`briefing-video${videoVisible ? ' briefing-video-visible' : ''}`}
            >
              <div className="briefing-video-glow" />
              <div className="briefing-video-inner">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&rel=0`}
                  title={`${data.country} briefing video`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
