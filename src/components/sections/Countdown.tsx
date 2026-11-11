import { useEffect, useMemo, useRef, useState } from 'react'
import { convite } from '../../config/convite'
import { useNow } from '../../hooks/useStores'
import { Card } from '../ui/Card'
import { SectionTitle } from '../ui/SectionTitle'
import { horaCurta, partyPhase } from '../../lib/datas'
import { indice } from '../../lib/secoes'
import { gerarRaio } from '../../lib/fx/raio'
import { perf } from '../../lib/perf'
import { acionar } from '../../poderes/acionar'

/** Um arco elétrico novo (SVG) cruzando o número a cada troca. */
function arco() {
  const r = gerarRaio({ x: 4, y: 20 + Math.random() * 20 }, { x: 96, y: 20 + Math.random() * 20 }, { niveis: 5, desvio: 0.3, galhos: 0.5 })
  return r.galhos.map((g) => 'M' + g.pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L')).join(' ')
}

/** Número em mono; quando muda, leva uma descarga elétrica (flash + arco). */
function Unidade({ valor, rotulo, digitos = 2 }: { valor: number; rotulo: string; digitos?: number }) {
  const txt = String(valor).padStart(digitos, '0')
  const [n, setN] = useState(0)
  const ant = useRef(txt)
  useEffect(() => {
    if (ant.current !== txt) {
      ant.current = txt
      setN((x) => x + 1)
    }
  }, [txt])
  const d = useMemo(() => (n && !perf.reducedMotion ? arco() : ''), [n])
  return (
    <div className="cont-un">
      <span key={n} className={`cont-num mono ${n ? 'troca' : ''}`}>
        {txt}
      </span>
      {d && (
        <svg key={`a${n}`} viewBox="0 0 100 60" preserveAspectRatio="none" className="cont-arco on" aria-hidden="true">
          <path d={d} fill="none" stroke="#1E90FF" strokeOpacity=".45" strokeWidth="6" strokeLinecap="round" />
          <path d={d} fill="none" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" />
          <path d={d} fill="none" stroke="#F2FEFF" strokeWidth=".8" strokeLinecap="round" />
        </svg>
      )}
      <span className="rotulo text-[10px] tracking-[0.24em]">{rotulo}</span>
    </div>
  )
}

/** No dia: explosão de energia cósmica quando a seção aparece. */
function Hoje() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let feito = false
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || feito) return
        feito = true
        const r = el.getBoundingClientRect()
        acionar.festa({ x: r.left + r.width / 2, y: r.top + r.height * 0.4 })
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className="py-4 text-center">
      <p className="display metal-ouro text-[84px]">É hoje</p>
      <p className="mt-3 text-[18px] font-semibold text-branco">
        A missão começa {horaCurta ? <>às <span className="mono text-dourado">{horaCurta.toUpperCase()}</span></> : 'hoje'}.
      </p>
      <p className="mt-1 text-[15px] txt-2">Te espero na {convite.festa.local}.</p>
    </div>
  )
}

function Depois() {
  return (
    <div className="py-4 text-center">
      <p className="display metal text-[60px]">Missão cumprida</p>
      <p className="mx-auto mt-3 max-w-[30ch] text-[17px] leading-relaxed txt-2">
        Obrigado por fazer parte da aventura. {convite.crianca.nome} agradece cada abraço e cada sorriso.
      </p>
    </div>
  )
}

export function Countdown() {
  const nowMs = useNow(1000)
  const fase = partyPhase(nowMs)
  const diff = Math.max(0, new Date(convite.festa.dataHora).getTime() - nowMs)
  const d = Math.floor(diff / 86_400_000)
  const h = Math.floor((diff / 3_600_000) % 24)
  const m = Math.floor((diff / 60_000) % 60)
  const s = Math.floor((diff / 1000) % 60)

  return (
    <section id="contagem" aria-labelledby="t-contagem" className="wrap secao acc-azul">
      <SectionTitle id="t-contagem" index={indice('contagem')} kicker={fase === 'depois' ? 'Fim da missão' : 'Contagem regressiva'} title={fase === 'antes' ? 'Falta pouco' : fase === 'hoje' ? 'Chegou o dia' : 'Valeu, agente'} />
      <Card className="reveal">
        {fase === 'antes' && (
          <>
            <div className="cartao-cab">
              <span className="rotulo text-[11px] acc-txt">Até a missão</span>
              <span className="rotulo ao-vivo text-[11px] text-ciano" aria-hidden="true">
                Ao vivo
              </span>
            </div>
            <div className="p-3.5 pb-4">
              <div role="timer" aria-hidden="true" className="cont-grade">
                <Unidade valor={d} rotulo={d === 1 ? 'dia' : 'dias'} digitos={d >= 100 ? 3 : 2} />
                <Unidade valor={h} rotulo="horas" />
                <Unidade valor={m} rotulo="min" />
                <Unidade valor={s} rotulo="seg" />
              </div>
              <p className="sr-only-live">
                Faltam {d} dias, {h} horas e {m} minutos para a festa.
              </p>
            </div>
          </>
        )}
        {fase === 'hoje' && <Hoje />}
        {fase === 'depois' && <Depois />}
      </Card>
    </section>
  )
}
