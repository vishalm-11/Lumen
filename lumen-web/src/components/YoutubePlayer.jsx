import { useEffect, useRef } from 'react'
import { loadYouTubeIframeAPI } from '../lib/youtubePlayer'

export default function YoutubePlayer({ videoId, onReady }) {
  const containerRef = useRef(null)
  const playerRef = useRef(null)
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  useEffect(() => {
    let destroyed = false

    loadYouTubeIframeAPI().then((YT) => {
      if (destroyed || !containerRef.current) return

      playerRef.current = new YT.Player(containerRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            if (destroyed) return
            onReadyRef.current?.(event.target)
          },
        },
      })
    })

    return () => {
      destroyed = true
      playerRef.current?.destroy?.()
      playerRef.current = null
    }
  }, [videoId])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
      title="Country briefing video"
    />
  )
}
