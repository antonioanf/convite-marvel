import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { gerarRaio } from '../../lib/fx/raio'
import { perf } from '../../lib/perf'

/**
 * "JOÃO LUCAS · 5 ANOS" em letras de metal (SVG), com eletricidade correndo DENTRO das letras
 * (arcos fractais recortados pelo próprio texto) e, de vez em quando, um arco que salta por cima.
 * `acender()` faz o metal brilhar como se tivesse sido atingido por um raio.
 * Decorativo (aria-hidden): o texto real fica num <h1> para leitores de tela.
 */
export interface TituloHandle {
  acender: () => void
  svg: () => SVGSVGElement | null
}

const FONTE = "'Bebas Neue', 'Oswald', Impact, sans-serif"

export const TituloEletrico = forwardRef<TituloHandle, { nome: string; idade: string; ativo: boolean }>(function TituloEletrico({ nome, idade, ativo }, ref) {
  const svg = useRef<SVGSVGElement>(null)
  const dentro = useRef<SVGGElement>(null)
  const fora = useRef<SVGGElement>(null)
  const luz = useRef<SVGGElement>(null)

  useImperativeHandle(ref, () => ({
    acender() {
      luz.current?.animate([{ opacity: 0.95 }, { opacity: 0.35, offset: 0.15 }, { opacity: 0.8, offset: 0.25 }, { opacity: 0 }], { duration: 900, easing: 'ease-out' })
    },
    svg: () => svg.current,
  }))

  useEffect(() => {
    if (!ativo || perf.reducedMotion) return
    const g = dentro.current!
    const gf = fora.current!
    let id = 0
    let cancelado = false
    // 1) descobre onde está o metal: desenha o título num canvas invisível (mesmo tamanho do viewBox)
    //    e guarda os pontos que caem dentro das letras
    const mapear = () => {
      const c = document.createElement('canvas')
      c.width = 400
      c.height = 186
      const x = c.getContext('2d', { willReadFrequently: true })!
      x.fillStyle = '#fff'
      x.textBaseline = 'alphabetic'
      // linha 1: o SVG força 380 de largura (textLength), então escalamos na horizontal
      x.font = `104px ${FONTE}`
      const w1 = x.measureText(nome).width || 1
      x.save()
      x.translate(200, 100)
      x.scale(380 / w1, 1)
      x.textAlign = 'center'
      x.fillText(nome, 0, 0)
      x.restore()
      // linha 2: letras espaçadas de 9 (desenha letra a letra)
      x.font = `54px ${FONTE}`
      x.textAlign = 'left'
      const larg = [...idade].map((ch) => x.measureText(ch).width + 9)
      let cx = 200 - (larg.reduce((a, b) => a + b, 0) - 9) / 2
      ;[...idade].forEach((ch, i) => {
        x.fillText(ch, cx, 174)
        cx += larg[i]
      })
      const d = x.getImageData(0, 0, 400, 186).data
      const pts: [number, number][] = []
      for (let yy = 0; yy < 186; yy += 3) for (let xx = 0; xx < 400; xx += 3) if (d[(yy * 400 + xx) * 4 + 3] > 140) pts.push([xx, yy])
      return pts
    }
    // 2) arco entre dois pontos do metal próximos (pode saltar o vão entre letras)
    const arco = (pts: [number, number][], min: number, max: number) => {
      const a = pts[(Math.random() * pts.length) | 0]
      let b = a
      for (let k = 0; k < 24; k++) {
        const q = pts[(Math.random() * pts.length) | 0]
        const dd = Math.hypot(q[0] - a[0], q[1] - a[1])
        if (dd > min && dd < max) {
          b = q
          break
        }
      }
      const r = gerarRaio({ x: a[0], y: a[1] }, { x: b[0], y: b[1] }, { niveis: 5, desvio: 0.28, galhos: 0.4 })
      return r.galhos.map((ga) => 'M' + ga.pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L')).join(' ')
    }
    const camadas = (d: string, forte = 1) =>
      `<path d="${d}" stroke="#4F8BFF" stroke-opacity="${0.28 * forte}" stroke-width="9"/>` +
      `<path d="${d}" stroke="#9CC6FF" stroke-opacity="${0.8 * forte}" stroke-width="2.8"/>` +
      `<path d="${d}" stroke="#F4FAFF" stroke-width="1.1"/>`
    document.fonts.load(`104px ${FONTE}`).then(() => {
      if (cancelado) return
      const pts = mapear()
      if (!pts.length) return
      let tick = 0
      id = window.setInterval(() => {
        tick++
        const n = perf.isLite() ? 2 : 4
        let s = ''
        for (let i = 0; i < n; i++) s += camadas(arco(pts, 14, 46))
        g.innerHTML = s
        g.setAttribute('opacity', (0.5 + Math.random() * 0.5).toFixed(2))
        // a cada ~1,5 s um arco longo atravessa o nome e some rápido
        if (tick % 22 === 0) gf.innerHTML = camadas(arco(pts, 90, 200), 1.2)
        else if (tick % 22 === 2) gf.innerHTML = ''
      }, 70)
    })
    return () => {
      cancelado = true
      clearInterval(id)
      g.innerHTML = ''
      gf.innerHTML = ''
    }
  }, [ativo, nome, idade])

  const t1 = { x: 200, y: 100, textAnchor: 'middle' as const, fontFamily: FONTE, fontSize: 104, textLength: 380, lengthAdjust: 'spacingAndGlyphs' as const }
  const t2 = { x: 200, y: 174, textAnchor: 'middle' as const, fontFamily: FONTE, fontSize: 54, letterSpacing: 9 }
  return (
    <svg ref={svg} viewBox="0 0 400 186" className="titulo-svg block w-full overflow-visible" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="tm1" gradientUnits="userSpaceOnUse" x1="0" y1="28" x2="0" y2="100">
          <stop offset="0" stopColor="#F7F9FC" />
          <stop offset=".38" stopColor="#CCD5E1" />
          <stop offset=".5" stopColor="#626D7D" />
          <stop offset=".62" stopColor="#A9B4C3" />
          <stop offset="1" stopColor="#EEF2F7" />
        </linearGradient>
        <linearGradient id="tm2" gradientUnits="userSpaceOnUse" x1="0" y1="136" x2="0" y2="174">
          <stop offset="0" stopColor="#FFF3D6" />
          <stop offset=".36" stopColor="#FFC76B" />
          <stop offset=".5" stopColor="#B8410E" />
          <stop offset=".64" stopColor="#FF8A3D" />
          <stop offset="1" stopColor="#FFE1A8" />
        </linearGradient>
        <clipPath id="tclip">
          <text {...t1}>{nome}</text>
          <text {...t2}>{idade}</text>
        </clipPath>
        <filter id="tsombra" x="-10%" y="-20%" width="120%" height="150%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="0.6" floodColor="#000" floodOpacity=".75" />
          <feDropShadow dx="0" dy="0" stdDeviation="9" floodColor="#7FB8FF" floodOpacity=".22" />
        </filter>
      </defs>
      <g filter="url(#tsombra)">
        <text {...t1} fill="url(#tm1)" stroke="#0B0F15" strokeWidth="1.2" paintOrder="stroke">
          {nome}
        </text>
        <text {...t2} fill="url(#tm2)" stroke="#1A0A04" strokeWidth="1" paintOrder="stroke">
          {idade}
        </text>
      </g>
      {/* bisel: filete claro no topo das letras */}
      <g clipPath="url(#tclip)" opacity=".5">
        <rect x="0" y="28" width="400" height="3" fill="#fff" />
        <rect x="0" y="136" width="400" height="2" fill="#fff" />
      </g>
      {/* clarão do metal quando o raio atinge */}
      <g ref={luz} opacity="0" clipPath="url(#tclip)">
        <rect x="0" y="0" width="400" height="186" fill="#DCEBFF" />
      </g>
      <g ref={dentro} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <g ref={fora} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
})
