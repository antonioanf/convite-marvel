import { music } from '../../lib/audio'
import { useMusicAvailable, useMusicPlaying } from '../../hooks/useStores'
import { vibrate } from '../../lib/haptics'

/** Botão de música (dentro da pill flutuante) com ondas sonoras animadas. */
export function MusicButton() {
  const playing = useMusicPlaying()
  const available = useMusicAvailable()
  if (!available) return null
  return (
    <button
      type="button"
      onClick={() => {
        vibrate(8)
        music.toggle()
      }}
      aria-label={playing ? 'Pausar música' : 'Tocar música'}
      aria-pressed={playing}
      className="music-btn"
    >
      <span className={`eq ${playing ? 'on' : ''}`} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
    </button>
  )
}
