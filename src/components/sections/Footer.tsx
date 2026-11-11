import { useEffect, useRef, type RefObject } from 'react'
import { convite } from '../../config/convite'
import { dataCurta } from '../../lib/datas'
import { perf } from '../../lib/perf'
import { Emblema } from '../ui/Emblema'

/** Brasas e poeira dourada subindo atrás da assinatura (canvas pequeno, só roda com o rodapé na tela). */
function Brasas({ alvo }: { alvo: RefObject<HTMLElement | null> }) {
  const cv = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = cv.current
    const el = alvo.current
    if (!c || !el || perf.reducedMotion) return
    const ctx = c.getContext('2d')!
    let W = 0
    let H = 0
    const medir = () => {
      W = c.clientWidth
      H = c.clientHeight
      c.width = W
      c.height = H
    }
    medir()
    const sprite = (stops: [number, string][]) => {
      const s = document.createElement('canvas')
      s.width = s.height = 32
      const g = s.getContext('2d')!
      const rg = g.createRadialGradient(16, 16, 0, 16, 16, 16)
      stops.forEach(([o, cor]) => rg.addColorStop(o, cor))
      g.fillStyle = rg
      g.fillRect(0, 0, 32, 32)
      return s
    }
    const brasa = sprite([[0, 'rgba(255,240,200,1)'], [0.25, 'rgba(255,150,50,.85)'], [1, 'rgba(230,60,0,0)']])
    const ouro = sprite([[0, 'rgba(255,240,190,1)'], [0.3, 'rgba(245,183,0,.6)'], [1, 'rgba(245,183,0,0)']])
    const n = perf.isLite() ? 22 : 40
    const ps = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 14 + Math.random() * 30, z: Math.random(), s: Math.random() * 10, b: Math.random() < 0.4 }))
    let raf = 0
    let ult = performance.now()
    const quadro = (t: number) => {
      raf = requestAnimationFrame(quadro)
      const dt = Math.min(0.05, (t - ult) / 1000)
      ult = t
      ctx.clearRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'lighter'
      for (const p of ps) {
        p.y -= p.v * (0.5 + p.z) * dt
        p.x += Math.sin(t / 900 + p.s) * 10 * dt
        if (p.y < -10) ((p.y = H + 10), (p.x = Math.random() * W))
        const k = p.y / H // somem ao subir
        const tam = (p.b ? 2 + p.z * 3 : 1.2 + p.z * 2.2) * 3
        ctx.globalAlpha = Math.max(0, Math.min(1, k * 1.3)) * (0.4 + p.z * 0.6) * (0.75 + 0.25 * Math.sin(t / 90 + p.s * 7))
        ctx.drawImage(p.b ? brasa : ouro, p.x - tam, p.y - tam, tam * 2, tam * 2)
      }
      ctx.globalAlpha = 1
    }
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf)
      if (e.isIntersecting && !document.hidden) {
        medir()
        ult = performance.now()
        raf = requestAnimationFrame(quadro)
      }
    })
    io.observe(el)
    const vis = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden) raf = requestAnimationFrame(quadro)
    }
    document.addEventListener('visibilitychange', vis)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', vis)
    }
  }, [alvo])
  return <canvas ref={cv} aria-hidden="true" />
}

export function Footer() {
  const ref = useRef<HTMLElement>(null)
  return (
    <footer ref={ref} className="rodape acc-dourado pb-14 pt-10 text-center">
      <Brasas alvo={ref} />
      <div className="wrap rodape-txt relative flex flex-col items-center">
        <Emblema size={54} id="rod" className="drop-shadow-[0_0_16px_rgb(245_183_0/.45)]" />
        <p className="display metal-ouro mt-5 text-[46px]">Te espero na festa!</p>
        {convite.assinatura && <p className="mt-3 text-[17px] font-semibold text-branco">{convite.assinatura}</p>}
        <p className="rotulo mt-4 text-[11px] text-branco">
          {convite.crianca.nome} · {dataCurta}
        </p>
      </div>
    </footer>
  )
}
