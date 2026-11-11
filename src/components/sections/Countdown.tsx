import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { convite } from '../../config/convite'
import { useNow } from '../../hooks/useStores'
import { Card } from '../ui/Card'
import { SectionTitle } from '../ui/SectionTitle'
import { ButterflyIcon } from '../ui/ButterflyIcon'
import { field } from '../../lib/butterflyField'
import { hora, partyPhase } from '../../lib/datas'
import { indice } from '../../lib/secoes'
import { useHolo } from '../../lib/holo'
import { perf } from '../../lib/perf'

export { partyPhase }

/** Cartão que vira (flip) quando o valor muda. */
function Flip({ value }: { value: string }) {
  const [s, setS] = useState({ cur: value, prev: value, n: 0 })
  if (value !== s.cur) setS({ cur: value, prev: s.cur, n: s.n + 1 })
  return (
    <div className="flip" aria-hidden="true">
      <div className="flip-half flip-top">
        <span>{s.cur}</span>
      </div>
      <div className="flip-half flip-bottom">
        <span>{s.prev}</span>
      </div>
      {s.n > 0 && (
        <>
          <div key={`t${s.n}`} className="flip-half flip-top anim">
            <span>{s.prev}</span>
          </div>
          <div key={`b${s.n}`} className="flip-half flip-bottom anim">
            <span>{s.cur}</span>
          </div>
        </>
      )}
    </div>
  )
}

function Unit({ value, label, digits = 2 }: { value: number; label: string; digits?: number }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <Flip value={String(value).padStart(digits, '0')} />
      <span className="label text-[11px] tracking-[0.16em]">{label}</span>
    </div>
  )
}

function Today() {
  const ref = useRef<HTMLDivElement>(null)
  const title = useRef<HTMLParagraphElement>(null)
  useHolo(title)
  // efeito especial: revoadas periódicas de borboletas saindo do título
  useEffect(() => {
    const fire = () => {
      const r = ref.current?.getBoundingClientRect()
      if (r && r.top < innerHeight && r.bottom > 0) field.burst(r.left + r.width / 2, r.top + r.height / 3, perf.isLite() ? 2 : 4)
    }
    const id = setInterval(fire, 4500)
    const first = setTimeout(fire, 600)
    return () => {
      clearInterval(id)
      clearTimeout(first)
    }
  }, [])
  return (
    <div ref={ref} className="py-3 text-center">
      <motion.p
        ref={title}
        data-holo
        initial={perf.reducedMotion ? false : { scale: 0.6, opacity: 0, rotate: -6 }}
        whileInView={{ scale: 1, opacity: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ type: 'spring', stiffness: 180, damping: 12 }}
        className="holo-text serif text-[76px] leading-none"
      >
        É hoje!
      </motion.p>
      <div className="mt-2 flex justify-center gap-2" aria-hidden="true">
        <ButterflyIcon size={30} speed={0.3} />
        <ButterflyIcon size={22} speed={0.25} className="-mt-3" />
        <ButterflyIcon size={30} speed={0.35} />
      </div>
      <p className="mt-3 text-[18px] font-semibold text-roxo">
        {hora ? (
          <>
            Te esperamos às <span className="mono text-violeta-txt">{hora}</span> 🦋
          </>
        ) : (
          <>Te esperamos! 🦋</>
        )}
      </p>
    </div>
  )
}

function Thanks() {
  return (
    <div className="py-3 text-center">
      <p className="serif text-[56px] leading-tight text-roxo">Obrigado!</p>
      <p className="mx-auto mt-2 max-w-[28ch] text-[17px] leading-relaxed text-tinta-2">
        A festa foi linda porque você fez parte dela. {convite.crianca.nome} agradece cada abraço e cada sorriso 💜
      </p>
    </div>
  )
}

export function Countdown() {
  const nowMs = useNow(1000)
  const phase = partyPhase(nowMs)
  const diff = Math.max(0, new Date(convite.festa.dataHora).getTime() - nowMs)
  const d = Math.floor(diff / 86_400_000)
  const h = Math.floor((diff / 3_600_000) % 24)
  const m = Math.floor((diff / 60_000) % 60)
  const sec = Math.floor((diff / 1000) % 60)

  return (
    <section id="contagem" aria-labelledby="t-contagem" className="wrap pb-14">
      <SectionTitle
        id="t-contagem"
        index={indice('contagem')}
        kicker={phase === 'depois' ? 'Foi lindo' : 'Contagem regressiva'}
        title={phase === 'antes' ? 'Falta pouco' : phase === 'hoje' ? 'Chegou o dia' : 'Que festa!'}
      />
      <Card blur className="reveal px-3.5 pb-5 pt-4">
        {phase === 'antes' && (
          <>
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="label text-[11px]">até a festa</span>
              <span className="label flex items-center gap-1.5 text-[11px]" aria-hidden="true">
                <span key={sec} className="live-dot" />
                ao vivo
              </span>
            </div>
            <div role="timer" className="flex gap-2">
              <Unit value={d} label={d === 1 ? 'dia' : 'dias'} digits={d >= 100 ? 3 : 2} />
              <Unit value={h} label="horas" />
              <Unit value={m} label="min" />
              <Unit value={sec} label="seg" />
            </div>
            <p className="sr-only-live">
              Faltam {d} dias, {h} horas e {m} minutos para a festa.
            </p>
            {!convite.festa.horarioDefinido && (
              <p className="mt-4 px-1 text-center text-[14px] font-medium text-tinta-2">Horário a confirmar 💜</p>
            )}
          </>
        )}
        {phase === 'hoje' && <Today />}
        {phase === 'depois' && <Thanks />}
      </Card>
    </section>
  )
}
