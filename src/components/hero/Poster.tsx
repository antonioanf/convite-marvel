import { useEffect, useMemo, useRef } from 'react'
import { iniciarAtmosfera } from '../../lib/fx/atmosfera'
import { pintarCeu } from '../../lib/fx/ceu'
import { rochasSvg } from '../../lib/fx/rochas'
import { perf } from '../../lib/perf'

/** Pinta o céu num Worker (sem travar a tela); sem Worker, pinta direto quando o celular estiver livre. */
function pintar(canvas: HTMLCanvasElement) {
  const w = perf.isLite() ? 150 : 230
  const r = canvas.getBoundingClientRect()
  const h = Math.max(120, Math.round(w * ((r.height || innerHeight) / Math.max(1, r.width || innerWidth))))
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
 * Fundo do hero como pôster de cinema (tudo gerado por código):
 *  - topo: céu de tempestade com uma explosão de luz atravessando as nuvens no centro-alto,
 *    raios de luz volumétricos saindo dela; nuvens acesas em dourado, laranja e azul nas bordas;
 *  - meio: contraluz atrás do emblema e do título;
 *  - base: rochas escuras em primeiro plano, com brasas e poeira subindo entre elas;
 *  - embaixo: degradê até o quase preto azulado (#05070D), onde ficam as informações.
 * Fica atrás do conteúdo do hero e rola junto com ele.
 */
export function Poster() {
  const ceu = useRef<HTMLCanvasElement>(null)
  const atm = useRef<HTMLCanvasElement>(null)
  const flash = useRef<HTMLDivElement>(null)
  const rochas = useMemo(() => rochasSvg(3), [])
  useEffect(() => pintar(ceu.current!), [])
  useEffect(() => {
    const a = iniciarAtmosfera(atm.current!, flash.current!, 130)
    const vis = () => a.pausar(document.hidden)
    document.addEventListener('visibilitychange', vis)
    return () => {
      document.removeEventListener('visibilitychange', vis)
      a.parar()
    }
  }, [])
  return (
    <div className="poster" aria-hidden="true">
      <canvas ref={ceu} className="poster-ceu" />
      <div className="poster-raios" />
      <div className="poster-explosao" />
      <div ref={flash} className="relampago" />
      <div className="poster-contraluz" />
      <canvas ref={atm} className="poster-atm" />
      <div className="poster-rochas" dangerouslySetInnerHTML={{ __html: rochas }} />
      <div className="poster-grao" />
    </div>
  )
}
