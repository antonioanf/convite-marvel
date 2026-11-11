import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView } from 'framer-motion'
import { convite } from '../../config/convite'
import { Card } from '../ui/Card'
import { Photo } from '../ui/Photo'
import { useHolo } from '../../lib/holo'
import { now } from '../../lib/debug'
import { diasAte, partyPhase } from '../../lib/datas'
import { perf } from '../../lib/perf'

/** Número que conta de 0 até `to` quando aparece na tela. */
function CountUp({ to, className }: { to: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const [v, setV] = useState(perf.reducedMotion ? to : 0)
  useEffect(() => {
    if (!inView || perf.reducedMotion) return
    const a = animate(0, to, { duration: 1.6, ease: [0.2, 0.8, 0.2, 1], onUpdate: (x) => setV(Math.round(x)) })
    return () => a.stop()
  }, [inView, to])
  return (
    <span ref={ref} className={className}>
      {v}
    </span>
  )
}

/** Bento da idade: foto girando (formato original, sem cortar) + número holográfico + dias que faltam. */
export function Destaque() {
  const three = useRef<HTMLSpanElement>(null)
  useHolo(three)
  const c = convite.crianca
  const foto = convite.fotoDestaque
  const t = now()
  const fase = partyPhase(t)
  const dias = diasAte(t)

  return (
    <section id="tres" aria-labelledby="t-tres" className="wrap pb-14">
      <h2 id="t-tres" className="sr-only">
        {c.nome} vai fazer {c.idade} aninhos
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <Card className="reveal col-span-2 p-1.5">
          <motion.div
            initial={perf.reducedMotion ? false : { clipPath: 'inset(10% 8% 10% 8% round 22px)' }}
            whileInView={{ clipPath: 'inset(0% 0% 0% 0% round 22px)' }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative overflow-hidden rounded-[22px]"
            style={{ aspectRatio: `${foto.largura ?? 4} / ${foto.altura ?? 3}` }}
          >
            <div data-parallax className="absolute inset-[-7%_0]">
              <Photo foto={foto} sizes="(max-width: 480px) 92vw, 450px" />
            </div>
          </motion.div>
        </Card>

        <Card holo className="reveal flex aspect-square flex-col justify-between p-4">
          <span className="label">Idade</span>
          <span ref={three} className="holo-text serif -mb-1 mt-1 text-[clamp(92px,27vw,118px)] leading-[0.8]" data-holo aria-hidden="true">
            {c.idade}
          </span>
          <span className="text-[17px] font-bold text-roxo">{c.idade === 1 ? 'aninho' : 'aninhos'}</span>
        </Card>

        <Card className="reveal flex aspect-square flex-col justify-between p-4">
          <span className="label">{fase === 'antes' ? 'Faltam' : fase === 'hoje' ? 'Chegou' : 'Foi lindo'}</span>
          {fase === 'antes' ? (
            <CountUp to={dias} className="mono text-[56px] font-semibold leading-none tracking-tight text-violeta-txt" />
          ) : (
            <span className="text-[44px] leading-none" aria-hidden="true">
              🦋
            </span>
          )}
          <span className="text-[15px] font-semibold leading-tight text-tinta-2">
            {fase === 'antes' ? (dias === 1 ? 'dia para a festa' : 'dias para a festa') : fase === 'hoje' ? 'É hoje!' : 'Obrigado por virem!'}
          </span>
        </Card>
      </div>
    </section>
  )
}
