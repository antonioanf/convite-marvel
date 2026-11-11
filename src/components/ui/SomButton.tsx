import { som } from '../../lib/audio'
import { useMuted, useMusicPlaying } from '../../hooks/useStores'
import { vibrate } from '../../lib/haptics'

/** Botão de mudo (sempre visível na barra de baixo). */
export function SomButton() {
  const muted = useMuted()
  const playing = useMusicPlaying()
  if (!som.available) return null
  return (
    <button
      type="button"
      onClick={() => {
        vibrate(8)
        som.toggleMute()
      }}
      aria-label={muted ? 'Ligar o som' : 'Desligar o som'}
      aria-pressed={muted}
      className="som-btn"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 9h4l5-4v14l-5-4H4z" />
        {muted ? (
          <path d="M16.5 9.5l5 5M21.5 9.5l-5 5" />
        ) : (
          <g className={playing ? 'som-ondas on' : 'som-ondas'}>
            <path d="M16 9a4 4 0 0 1 0 6" />
            <path d="M18.5 6.5a7.5 7.5 0 0 1 0 11" />
          </g>
        )}
      </svg>
    </button>
  )
}
