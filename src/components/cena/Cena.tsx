import { useEffect, useMemo, useRef } from 'react'
import { cidadeSvg } from '../../lib/cidade'
import { iniciarAtmosfera } from '../../lib/fx/atmosfera'

/**
 * Cenário fixo de cinema: céu de tempestade, nuvens em camadas (as distantes desfocadas),
 * feixes de luz volumétrica, cidade em silhueta no horizonte, brasas e poeira em profundidade
 * e relâmpagos distantes de vez em quando. Granulação de filme e vinheta por cima.
 */
export function Cena() {
  const cv = useRef<HTMLCanvasElement>(null)
  const flash = useRef<HTMLDivElement>(null)
  const cidade = useMemo(
    () => cidadeSvg({ fundo: '#0B111C', frente: '#06090F', contorno: '#0F1726', janela: 'rgba(255,196,120,.42)' }, { seed: 4, contorno: false, janela: [1.6, 1.8], chance: 0.16, altura: 1.25 }),
    [],
  )
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
        <div className="nuvens longe" />
        <div className="feixes" />
        <div ref={flash} className="relampago" />
        <canvas ref={cv} className="atmosfera" />
        <div className="nuvens perto" />
        <div className="horizonte" dangerouslySetInnerHTML={{ __html: cidade }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 85% at 50% 40%, transparent 55%, rgb(0 0 0 / .6))' }} />
      </div>
      <div className="grao" aria-hidden="true" />
    </>
  )
}
