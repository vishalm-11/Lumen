import { useEffect, useState, useCallback } from 'react'

const LINE_PAIRS = [
  { from: 'top', to: 'topLeft' },
  { from: 'top', to: 'topRight' },
  { from: 'bottom', to: 'bottomLeft' },
  { from: 'bottom', to: 'bottomRight' },
  { from: 'mid', to: 'midLeft' },
]

function getPoints(panelRect, videoRect, layoutRect) {
  const panelRight = panelRect.right - layoutRect.left
  const inset = panelRect.height * 0.12

  const sources = {
    top: { x: panelRight, y: panelRect.top - layoutRect.top + inset },
    bottom: { x: panelRight, y: panelRect.bottom - layoutRect.top - inset },
    mid: { x: panelRight, y: panelRect.top - layoutRect.top + panelRect.height / 2 },
  }

  const targets = {
    topLeft: { x: videoRect.left - layoutRect.left, y: videoRect.top - layoutRect.top },
    topRight: { x: videoRect.right - layoutRect.left, y: videoRect.top - layoutRect.top },
    bottomLeft: { x: videoRect.left - layoutRect.left, y: videoRect.bottom - layoutRect.top },
    bottomRight: { x: videoRect.right - layoutRect.left, y: videoRect.bottom - layoutRect.top },
    midLeft: { x: videoRect.left - layoutRect.left, y: videoRect.top - layoutRect.top + videoRect.height / 2 },
  }

  return LINE_PAIRS.map(({ from, to }) => ({
    x1: sources[from].x,
    y1: sources[from].y,
    x2: targets[to].x,
    y2: targets[to].y,
  }))
}

export default function HolographicProjection({ layoutRef, panelRef, videoRef, active, onLinesComplete }) {
  const [lines, setLines] = useState([])
  const [size, setSize] = useState({ width: 0, height: 0 })

  const updateLines = useCallback(() => {
    const layout = layoutRef.current
    const panel = panelRef.current
    const video = videoRef.current
    if (!layout || !panel || !video) return

    const layoutRect = layout.getBoundingClientRect()
    const panelRect = panel.getBoundingClientRect()
    const videoRect = video.getBoundingClientRect()

    setSize({ width: layoutRect.width, height: layoutRect.height })
    setLines(getPoints(panelRect, videoRect, layoutRect))
  }, [layoutRef, panelRef, videoRef])

  useEffect(() => {
    if (!active) {
      setLines([])
      return
    }

    const raf = requestAnimationFrame(updateLines)
    const observer = new ResizeObserver(updateLines)
    if (layoutRef.current) observer.observe(layoutRef.current)
    window.addEventListener('resize', updateLines)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener('resize', updateLines)
    }
  }, [active, updateLines, layoutRef])

  useEffect(() => {
    if (!active || lines.length === 0) return

    const timer = setTimeout(() => {
      onLinesComplete?.()
    }, 950)

    return () => clearTimeout(timer)
  }, [active, lines, onLinesComplete])

  if (!active || lines.length === 0 || size.width === 0) return null

  return (
    <svg
      className="holographic-projection"
      width={size.width}
      height={size.height}
      viewBox={`0 0 ${size.width} ${size.height}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="holoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.85" />
        </linearGradient>
        <filter id="holoGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {lines.map((line, i) => {
        const length = Math.hypot(line.x2 - line.x1, line.y2 - line.y1)
        return (
          <line
            key={i}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="url(#holoGradient)"
            strokeWidth="1.5"
            filter="url(#holoGlow)"
            className="holo-projection-line"
            style={{
              '--line-length': length,
              '--line-delay': `${i * 0.08}s`,
            }}
          />
        )
      })}
    </svg>
  )
}
