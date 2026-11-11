import { FOREWING, HINDWING } from '../../lib/butterflySvg'
import { useId } from 'react'

/**
 * Borboleta vetorial holográfica (ícone/decoração) com batida de asas em CSS.
 * `light` = versão clara, para usar sobre botões com gradiente.
 */
export function ButterflyIcon({
  size = 32,
  flap = true,
  speed = 0.5,
  light = false,
  className = '',
  style,
}: {
  size?: number
  flap?: boolean
  speed?: number
  light?: boolean
  className?: string
  style?: React.CSSProperties
}) {
  const id = useId().replace(/:/g, '')
  const wing = (
    <>
      <path d={FOREWING} fill={`url(#f${id})`} />
      <path d={HINDWING} fill={`url(#h${id})`} />
      <path
        d={`${FOREWING} ${HINDWING}`}
        fill="none"
        stroke={light ? '#fff' : 'var(--color-violeta-txt)'}
        strokeOpacity={light ? 0.9 : 0.5}
        strokeWidth="1.4"
      />
      <circle cx="37" cy="-27" r="3.4" fill="#fff" fillOpacity=".9" />
    </>
  )
  const anim = flap ? { animationDuration: `${speed}s` } : { animation: 'none' }
  return (
    <svg
      width={size}
      height={size}
      viewBox="-52 -48 104 96"
      className={`bfly-icon ${className}`}
      style={{ overflow: 'visible', ...style }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`f${id}`} x1="0" y1="0" x2="1" y2="-1">
          <stop offset="0" stopColor={light ? '#fff' : 'var(--color-violeta)'} />
          <stop offset=".5" stopColor={light ? 'var(--color-holo-rosa)' : 'var(--color-lilas)'} />
          <stop offset="1" stopColor="var(--color-holo-ciano)" />
        </linearGradient>
        <linearGradient id={`h${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={light ? '#fff' : 'var(--color-violeta)'} />
          <stop offset="1" stopColor="var(--color-holo-rosa)" />
        </linearGradient>
      </defs>
      <g className="wr" style={anim}>
        {wing}
      </g>
      <g className="wl" style={anim}>
        <g transform="scale(-1,1)">{wing}</g>
      </g>
      <ellipse cx="0" cy="2" rx="2.6" ry="15" fill={light ? '#fff' : 'var(--color-roxo)'} />
      <path
        d="M-1,-12 Q-6,-25 -10,-29 M1,-12 Q6,-25 10,-29"
        stroke={light ? '#fff' : 'var(--color-roxo)'}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}
