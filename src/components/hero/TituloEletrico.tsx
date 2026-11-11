import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { gerarRaio } from '../../lib/fx/raio'
import { perf } from '../../lib/perf'
import { fundo } from '../../lib/fx/fundo'

/**
 * "JOÃO LUCAS · 5 ANOS" em letras de metal (SVG), com eletricidade correndo pelas letras (arcos
 * fractais entre pontos do próprio metal) e, de vez em quando, um arco longo que atravessa o nome.
 * Os arcos ficam num SVG separado, sem filtro: redesenhá-los não repinta o título (que tem sombra).
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
    // eletricidade: halo azul elétrico, corpo ciano, núcleo branco
    const camadas = (d: string, forte = 1) =>
      `<path d="${d}" stroke="#1E90FF" stroke-opacity="${0.32 * forte}" stroke-width="9"/>` +
      `<path d="${d}" stroke="#22D3EE" stroke-opacity="${0.85 * forte}" stroke-width="2.8"/>` +
      `<path d="${d}" stroke="#F2FEFF" stroke-width="1.1"/>`
    document.fonts.load(`104px ${FONTE}`).then(() => {
      if (cancelado) return
      const pts = mapear()
      if (!pts.length) return
      let tick = 0
      let ultimo = 0
      const passo = () => {
        const lite = perf.isLite()
        // modo leve: a eletricidade vem em rajadas (~1 s ligada a cada ~3 s), sem acordar a página no intervalo
        if (lite && tick % 7 === 6) {
          tick++
          g.innerHTML = ''
          gf.innerHTML = ''
          id = window.setTimeout(passo, 2000)
          return
        }
        id = window.setTimeout(passo, lite ? 150 : 70)
        if (fundo.pausado() || document.hidden) {
          if (ultimo) {
            g.innerHTML = ''
            gf.innerHTML = ''
            ultimo = 0
          }
          return
        }
        ultimo = 1
        tick++
        const n = lite ? 2 : 4 // modo leve: menos arcos
        let s = ''
        for (let i = 0; i < n; i++) s += camadas(arco(pts, 14, 46))
        g.innerHTML = s
        g.setAttribute('opacity', (0.5 + Math.random() * 0.5).toFixed(2))
        // a cada ~1,5 s um arco longo atravessa o nome e some rápido
        if (!lite && tick % 22 === 0) gf.innerHTML = camadas(arco(pts, 90, 200), 1.2)
        else if (lite ? tick % 7 === 3 : tick % 22 === 2) gf.innerHTML = lite ? camadas(arco(pts, 90, 200), 1.2) : ''
        else if (lite && tick % 7 === 5) gf.innerHTML = ''
      }
      passo()
    })
    return () => {
      cancelado = true
      clearTimeout(id)
      g.innerHTML = ''
      gf.innerHTML = ''
    }
  }, [ativo, nome, idade])

  const t1 = { x: 200, y: 100, textAnchor: 'middle' as const, fontFamily: FONTE, fontSize: 104, textLength: 380, lengthAdjust: 'spacingAndGlyphs' as const }
  const t2 = { x: 200, y: 174, textAnchor: 'middle' as const, fontFamily: FONTE, fontSize: 54, letterSpacing: 9 }
  return (
    <div className="relative">
    <svg ref={svg} viewBox="0 0 400 186" className="titulo-svg block w-full overflow-visible" aria-hidden="true" focusable="false">
      <defs>
        {/* aço polido refletindo o céu: dourado em cima, aço no meio, faixa vermelha embaixo */}
        <linearGradient id="tm1" gradientUnits="userSpaceOnUse" x1="0" y1="28" x2="0" y2="100">
          <stop offset="0" stopColor="#FFF8EC" />
          <stop offset=".2" stopColor="#FFDCA0" />
          <stop offset=".4" stopColor="#E3E6EC" />
          <stop offset=".5" stopColor="#5A1820" />
          <stop offset=".6" stopColor="#E62429" />
          <stop offset=".8" stopColor="#FF9F43" />
          <stop offset="1" stopColor="#FFF0D6" />
        </linearGradient>
        {/* reflexo de luz que corre pelo metal (vermelho → dourado) */}
        <linearGradient id="tm1b" gradientUnits="userSpaceOnUse" x1="-120" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#FFE7B0" stopOpacity=".7" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
          <animateTransform attributeName="gradientTransform" type="translate" values="-60 0; 640 0; 640 0" keyTimes="0; .45; 1" dur="5.5s" repeatCount="indefinite" />
        </linearGradient>
        {/* dourado incandescente */}
        <linearGradient id="tm2" gradientUnits="userSpaceOnUse" x1="0" y1="136" x2="0" y2="174">
          <stop offset="0" stopColor="#FFFBEA" />
          <stop offset=".3" stopColor="#FFE27A" />
          <stop offset=".48" stopColor="#F5B700" />
          <stop offset=".56" stopColor="#B05A00" />
          <stop offset=".74" stopColor="#FFC93A" />
          <stop offset="1" stopColor="#FFF4C4" />
        </linearGradient>
        <clipPath id="tclip">
          <text {...t1}>{nome}</text>
          <text {...t2}>{idade}</text>
        </clipPath>
        <filter id="tsombra" x="-10%" y="-20%" width="120%" height="150%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="0.6" floodColor="#000" floodOpacity=".8" />
          <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#FF6A00" floodOpacity=".35" />
        </filter>
      </defs>
      <g filter="url(#tsombra)">
        <text {...t1} fill="url(#tm1)" stroke="#12060A" strokeWidth="1.2" paintOrder="stroke">
          {nome}
        </text>
        <text {...t2} fill="url(#tm2)" stroke="#2A1200" strokeWidth="1" paintOrder="stroke">
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
        <rect x="0" y="0" width="400" height="186" fill="#D6F4FF" />
      </g>
    </svg>
    <svg viewBox="0 0 400 186" className="titulo-arcos" aria-hidden="true" focusable="false">
      {/* reflexo de luz que atravessa o metal (SVG sem filtro: não repinta o título) */}
      {!perf.reducedMotion && !perf.isLite() && <rect x="0" y="20" width="400" height="160" fill="url(#tm1b)" clipPath="url(#tclip)" />}
      <g ref={dentro} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <g ref={fora} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    </div>
  )
})
