import { useEffect, useMemo, useRef } from 'react'
import { cidadeSvg } from '../../lib/cidade'
import { iniciarAtmosfera } from '../../lib/fx/atmosfera'
import { pintarCeu } from '../../lib/fx/ceu'
import { perf } from '../../lib/perf'

/** Pinta as nuvens num Worker (sem travar a tela); sem Worker, pinta direto quando o celular estiver livre. */
function pintar(canvas: HTMLCanvasElement) {
  const lite = perf.isLite()
  const w = lite ? 150 : 230
  const h = Math.round((w / 1.24) * (innerHeight / Math.max(1, innerWidth)))
  canvas.width = w
  canvas.height = h
  const aplicar = (px: Uint8ClampedArray) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.putImageData(new ImageData(px as Uint8ClampedArray<ArrayBuffer>, w, h), 0, 0)
    canvas.classList.add('pronto')
  }
  try {
    const wk = new Worker(new URL('../../lib/fx/ceu.worker.ts', import.meta.url), { type: 'module' })
    wk.onmessage = (e: MessageEvent<Uint8ClampedArray>) => {
      aplicar(e.data)
      wk.terminate()
    }
    wk.onerror = () => {
      wk.terminate()
      setTimeout(() => aplicar(pintarCeu(w, h)), 800)
    }
    wk.postMessage({ w, h, seed: 7 })
    return () => wk.terminate()
  } catch {
    const id = setTimeout(() => aplicar(pintarCeu(w, h)), 800)
    return () => clearTimeout(id)
  }
}

/**
 * Cenário fixo de cinema: céu de entardecer épico (nuvens de tempestade acesas por baixo em laranja,
 * vermelho e dourado, rasgos de céu azul e roxo), raios de sol atravessando as nuvens, cidade em
 * silhueta contra o sol, brasas e poeira dourada em profundidade e relâmpagos de vez em quando.
 */
export function Cena() {
  const cv = useRef<HTMLCanvasElement>(null)
  const ceu = useRef<HTMLCanvasElement>(null)
  const flash = useRef<HTMLDivElement>(null)
  const cidade = useMemo(
    () => cidadeSvg({ fundo: '#1A0A1C', frente: '#0B0612', contorno: '#0B0612', janela: 'rgba(255,196,120,.5)' }, { seed: 4, contorno: false, janela: [1.6, 1.8], chance: 0.16, altura: 1.25 }),
    [],
  )
  useEffect(() => pintar(ceu.current!), [])
  useEffect(() => {
    const a = iniciarAtmosfera(cv.current!, flash.current!)
    const vis = () => a.pausar(document.hidden)
    document.addEventListener('visibilitychange', vis)
    return () => {
      document.removeEventListener('visibilitychange', vis)
      a.parar()
    }
  }, [])
  return (
    <>
      <div className="cena" aria-hidden="true">
        <canvas ref={ceu} className="ceu" />
        <div className="raios-sol" />
        <div ref={flash} className="relampago" />
        <div className="nuvens perto" />
        <canvas ref={cv} className="atmosfera" />
        <div className="horizonte" dangerouslySetInnerHTML={{ __html: cidade }} />
        <div className="cena-sombra" />
      </div>
      <div className="grao" aria-hidden="true" />
    </>
  )
}
