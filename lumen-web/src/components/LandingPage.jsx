import { useState } from 'react'
import ShaderBackground from './ShaderBackground'
import { ShimmerButton } from './ui/ShimmerButton'

export default function LandingPage({ onEnter }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #000000 100%)',
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
          fontFamily: 'JetBrains Mono',
          fontSize: '0.9rem',
          color: '#6B7280',
          letterSpacing: '0.3em',
          marginBottom: '40px',
        }}>
          GLOBAL NEWS INTELLIGENCE
        </div>
        
        {/* Description */}
        <div style={{
          fontFamily: 'DM Sans',
          fontSize: '1.1rem',
          lineHeight: 1.8,
          color: 'rgba(249,250,251,0.8)',
          marginBottom: '40px',
          maxWidth: '600px',
          margin: '0 auto 40px',
        }}>
          <p style={{ marginBottom: '20px' }}>
            Real-time global news intelligence for stock market analysis. 
            World events move markets, and Lumen makes that connection visible. 
            Click any country to see how news is driving financial markets with 
            AI-powered analysis and live market data.
          </p>
          <p style={{ 
            fontSize: '0.95rem',
            color: 'rgba(249,250,251,0.6)',
            fontStyle: 'italic',
          }}>
            Connecting global events to market movements in real time.
          </p>
        </div>
        
        {/* CTA Button */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <ShimmerButton
            onClick={onEnter}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            shimmerColor="#059669"
            shimmerDuration="3.2s"
            shimmerSize="0.06em"
            background="rgba(3,7,18,0.95)"
            borderRadius="999px"
          >
            <span
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: '0.9rem',
                letterSpacing: '0.2em',
                fontWeight: 600,
              }}
            >
              ENTER GLOBE →
            </span>
          </ShimmerButton>
        </div>
      </div>
      
    </div>
  )
}
