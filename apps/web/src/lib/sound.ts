let clickAudio: HTMLAudioElement | null = null
let ambientAudio: HTMLAudioElement | null = null

export function playClick() {
  try {
    if (!clickAudio) {
      clickAudio = new Audio('/520579__divoljud__clickglass.wav')
      clickAudio.volume = 0.4
    }
    clickAudio.currentTime = 0
    clickAudio.play().catch(() => {})
  } catch (_) {
    /* audio unavailable */
  }
}

export function toggleAmbient(): boolean {
  try {
    if (ambientAudio) {
      if (ambientAudio.paused) {
        ambientAudio.play().catch(() => {})
        return true
      }
      ambientAudio.pause()
      return false
    }
    ambientAudio = new Audio('/748404__viramiller__galactic-space-journey.mp3')
    ambientAudio.loop = true
    ambientAudio.volume = 0.25
    ambientAudio.play().catch(() => {})
    return true
  } catch (_) {
    return false
  }
}
