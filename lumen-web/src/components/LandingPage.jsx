import { useState } from 'react'
import ShaderBackground from './ShaderBackground'
import { ShimmerButton } from './ui/ShimmerButton'

export default function LandingPage({ onEnter }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #0a0f1e 0%, #12101a 50%, #0a0f1e 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <ShaderBackground />
      {/* Animated background dots */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        animation: 'float 20s ease-in-out infinite',
        opacity: 0.25,
        pointerEvents: 'none',
        zIndex: 1,
      }} />
      
      {/* Main content */}
      <div style={{
        zIndex: 10,
        textAlign: 'center',
        padding: '0 40px',
        maxWidth: '800px',
      }}>
        {/* Logo/Title */}
        <div style={{
          fontFamily: 'Bebas Neue',
          fontSize: '6rem',
          letterSpacing: '0.15em',
          color: '#FFFFFF',
          marginBottom: '20px',
          textShadow: '0 0 30px rgba(255,255,255,0.3)',
          lineHeight: 1,
        }}>
          LUMEN
        </div>
        
        {/* Subtitle */}
        <div style={{
          fontFamily: 'DM Sans',
          fontWeight: 500,
          fontSize: '0.9rem',
          color: '#6B7280',
          letterSpacing: '0.3em',
          marginBottom: '16px',
        }}>
          SEE IT. UNDERSTAND IT. ACT.
        </div>
        
        {/* Description */}
        <div style={{
          fontFamily: 'DM Sans',
          fontSize: '1.1rem',
          lineHeight: 1.8,
          color: 'rgba(249,250,251,0.8)',
          maxWidth: '600px',
          margin: '0 auto 16px',
        }}>
          <p style={{ margin: '0 0 16px' }}>
            Every country has a story. Explore the crises shaping our world, understand what's happening on the ground, and support the causes that matter.
          </p>
          <p style={{
            margin: 0,
            fontSize: '0.95rem',
            color: 'rgba(249,250,251,0.6)',
          }}>
            Click any country to get started.
          </p>
        </div>
        
        {/* CTA Button */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <ShimmerButton
            onClick={onEnter}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            shimmerColor="#F59E0B"
            shimmerDuration="3.2s"
            shimmerSize="0.06em"
            background="rgba(20, 10, 5, 0.95)"
            borderRadius="999px"
          >
            <span
              style={{
                fontFamily: 'DM Sans',
                fontSize: '0.9rem',
                letterSpacing: '0.2em',
                fontWeight: 600,
              }}
            >
              Explore →
            </span>
          </ShimmerButton>
        </div>
      </div>
      
    </div>
  )
}
