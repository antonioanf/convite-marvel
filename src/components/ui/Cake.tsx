/**
 * Bolinho (cupcake) com velas em SVG. `lit` = velas acesas; apagadas soltam fumacinha.
 * `progress` (0–1) encolhe as chamas enquanto a pessoa segura o dedo.
 * Animações só em transform/opacity.
 */
export function Cake({ candles, lit, progress = 0 }: { candles: number; lit: boolean; progress?: number }) {
  const n = Math.max(1, Math.min(9, candles))
  const gap = Math.min(26, 112 / n)
  const x0 = 100 - ((n - 1) * gap) / 2
  const xs = Array.from({ length: n }, (_, i) => x0 + i * gap)
  const flameScale = lit ? 1 - progress * 0.75 : 0
  return (
    <svg viewBox="0 0 200 178" className="cake h-full w-full overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="ck-liner" x1="0" x2="1">
          <stop offset="0" stopColor="var(--color-violeta)" />
          <stop offset=".5" stopColor="var(--color-lilas)" />
          <stop offset="1" stopColor="var(--color-violeta)" />
        </linearGradient>
        <linearGradient id="ck-frost" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fdd2e4" />
          <stop offset="1" stopColor="var(--color-rosa)" />
        </linearGradient>
        <linearGradient id="ck-candle" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="var(--color-lavanda)" />
        </linearGradient>
        <radialGradient id="ck-flame" cx=".5" cy=".7" r=".6">
          <stop offset="0" stopColor="#fffbe6" />
          <stop offset=".45" stopColor="#ffd36b" />
          <stop offset="1" stopColor="#ff7aa8" />
        </radialGradient>
        <radialGradient id="ck-glow">
          <stop offset="0" stopColor="#ffe9a8" stopOpacity=".75" />
          <stop offset="1" stopColor="#ffe9a8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* prato */}
      <ellipse cx="100" cy="166" rx="80" ry="9" fill="var(--color-lavanda)" />
      <ellipse cx="100" cy="163" rx="72" ry="7" fill="#fff" />
      {/* forminha */}
      <path d="M48 104 L60 162 H140 L152 104 Z" fill="url(#ck-liner)" />
      {[60, 74, 88, 100, 112, 126, 140].map((x, i) => (
        <path key={i} d={`M${x - (x - 100) * 0.0} 106 L${100 + (x - 100) * 0.78} 160`} stroke="#fff" strokeOpacity=".35" strokeWidth="2" />
      ))}
      {/* glacê */}
      <path
        d="M40 106 C30 92 44 78 58 82 C56 66 76 58 88 66 C92 52 110 50 116 64 C128 56 148 64 144 80 C160 78 168 96 158 106 Z"
        fill="url(#ck-frost)"
      />
      <path d="M58 90 C70 84 84 92 96 86 M104 82 C116 76 130 84 142 88" stroke="#fff" strokeOpacity=".7" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* confeitos */}
      {[
        [62, 98, 'var(--color-violeta)'],
        [80, 76, 'var(--color-holo-ciano)'],
        [124, 72, 'var(--color-violeta)'],
        [140, 96, 'var(--color-magenta)'],
        [100, 96, '#fff'],
        [112, 88, 'var(--color-magenta)'],
      ].map(([x, y, c], i) => (
        <circle key={i} cx={x as number} cy={y as number} r="2.6" fill={c as string} />
      ))}

      {/* velas */}
      {xs.map((x, i) => (
        <g key={i}>
          <rect x={x - 4} y={34 + (i % 2) * 4} width="8" height={36 - (i % 2) * 4} rx="3" fill="url(#ck-candle)" />
          <path d={`M${x - 4} ${44 + (i % 2) * 4} l8 -4 M${x - 4} ${54 + (i % 2) * 4} l8 -4 M${x - 4} ${64} l8 -4`} stroke="var(--color-lilas)" strokeWidth="2" />
          <path d={`M${x} ${34 + (i % 2) * 4} v-5`} stroke="var(--color-roxo)" strokeWidth="1.4" strokeLinecap="round" />
          {/* chama */}
          <g transform={`translate(${x} ${29 + (i % 2) * 4})`}>
            <g className="flame-wrap" style={{ transform: `scale(${flameScale})`, opacity: lit ? 1 : 0 }}>
              <circle r="16" cy="-9" fill="url(#ck-glow)" className="flame-glow" />
              <path className="flame" style={{ animationDelay: `${-i * 0.17}s` }} d="M0 0 C-6 -4 -6 -11 0 -20 C6 -11 6 -4 0 0 Z" fill="url(#ck-flame)" />
            </g>
            {/* fumacinha quando apaga */}
            {!lit && (
              <g className="smoke" style={{ animationDelay: `${i * 0.08}s` }}>
                <circle r="3.5" cy="-6" fill="var(--color-lilas)" fillOpacity=".55" />
                <circle r="5" cy="-14" cx="3" fill="var(--color-lavanda)" fillOpacity=".5" />
                <circle r="6" cy="-24" cx="-2" fill="var(--color-lavanda)" fillOpacity=".4" />
              </g>
            )}
          </g>
        </g>
      ))}
    </svg>
  )
}
