let apiReadyPromise = null

export function loadYouTubeIframeAPI() {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT)
  }

  if (!apiReadyPromise) {
    apiReadyPromise = new Promise((resolve) => {
      const previousReady = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        previousReady?.()
        resolve(window.YT)
      }

      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
      if (!existing) {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(tag)
      }
    })
  }

  return apiReadyPromise
}
