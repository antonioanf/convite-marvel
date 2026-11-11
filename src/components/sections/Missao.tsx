import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { convite } from '../../config/convite'
import { googleCalendarUrl } from '../../lib/calendar'
import { Card } from '../ui/Card'
import { SectionTitle } from '../ui/SectionTitle'
import { PressButton, PressLink } from '../ui/Press'
import { Icon } from '../ui/Icons'
import { ano, dataCurtaBarra, diaMes, diaSemana, hora } from '../../lib/datas'
import { indice } from '../../lib/secoes'
import { perf } from '../../lib/perf'
import { fx2d } from '../../lib/fx/camada2d'
import { sfx } from '../../lib/sfx'

const isApple = typeof navigator !== 'undefined' && /iPhone|iPad|Macintosh/.test(navigator.userAgent)
const CIFRA = '0123456789ABCDEF#%/:<>'
const sorteia = () => CIFRA[(Math.random() * CIFRA.length) | 0]

/**
 * Texto que chega "em código" (caracteres trocando) e se desfaz quando a rajada passa:
 * cada letra fica limpa no instante em que o feixe chega à posição dela (`progresso` de 0 a 1).
 */
function Codigo({ texto, progresso, className = '' }: { texto: string; progresso: number; className?: string }) {
  const [, tique] = useState(0)
  const chars = [...texto]
  // enquanto ainda há letra cifrada, troca os caracteres ~14x por segundo
  useEffect(() => {
    if (progresso >= 1) return
    const id = setInterval(() => tique((x) => x + 1), 70)
    return () => clearInterval(id)
  }, [progresso])
  return (
    <span className={`cod ${className}`} aria-hidden="true">
      {chars.map((ch, i) => {
        const limpo = ch === ' ' || progresso >= (i + 0.5) / chars.length
        return (
          <span key={i} className={`ch ${limpo ? 'limpo' : 'cifrado'}`}>
            {limpo ? ch : sorteia()}
          </span>
        )
      })}
    </span>
  )
}

/** Mapa tático desenhado em código (ruas e quadras em volta de um pino), sem imagem da internet. */
function MapaTatico() {
  const ruas = useMemo(() => {
    let s = ''
    for (let i = 0; i < 9; i++) s += `M${-20 + i * 48} -10 L${10 + i * 48 + (i % 2) * 18} 170 `
    for (let j = 0; j < 6; j++) s += `M-10 ${10 + j * 30} L410 ${20 + j * 30 - (j % 2) * 12} `
    return s
  }, [])
  return (
    <div className="mapa" aria-hidden="true">
      <svg viewBox="0 0 400 150" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="mp-luz" cx="50%" cy="50%" r="60%">
            <stop offset="0" stopColor="rgb(230 36 41 / .28)" />
            <stop offset="1" stopColor="rgb(230 36 41 / 0)" />
          </radialGradient>
        </defs>
        <rect width="400" height="150" fill="url(#mp-luz)" />
        <path d={ruas} stroke="rgb(255 246 236 / .12)" strokeWidth="6" fill="none" />
        <path d={ruas} stroke="rgb(255 246 236 / .22)" strokeWidth="1" fill="none" />
        <path d="M-10 110 C 90 80, 180 130, 260 90 S 380 60, 420 70" stroke="rgb(245 183 0 / .55)" strokeWidth="3" fill="none" />
        <circle cx="200" cy="75" r="46" fill="none" stroke="rgb(230 36 41 / .5)" strokeDasharray="4 6" />
        <circle cx="200" cy="75" r="78" fill="none" stroke="rgb(230 36 41 / .25)" strokeDasharray="2 8" />
      </svg>
      {!perf.reducedMotion && <span className="varredura" />}
      <span className="pino" />
    </div>
  )
}

export function Missao() {
  const f = convite.festa
  const [agenda, setAgenda] = useState(false)
  const [prog, setProg] = useState(perf.reducedMotion ? 1 : 0)
  const bloco = useRef<HTMLDivElement>(null)
  const feixe = useRef<HTMLDivElement>(null)

  // a rajada atravessa o cartão quando ele aparece e decodifica data e horário
  useEffect(() => {
    if (perf.reducedMotion) return
    const el = bloco.current
    if (!el) return
    let raf = 0
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        const t0 = performance.now()
        const dur = 1100
        const r = el.getBoundingClientRect()
        let ultFaisca = 0
        sfx.sopro(0.9)
        const passo = (now: number) => {
          const k = Math.min(1, (now - t0) / dur)
          const e2 = 1 - Math.pow(1 - k, 2)
          setProg(e2)
          if (feixe.current) {
            feixe.current.style.opacity = k < 1 ? '1' : '0'
            feixe.current.style.transform = `translateX(${(e2 * r.width).toFixed(1)}px)`
          }
          // faíscas na frente da rajada (posição medida uma vez no começo)
          if (now - ultFaisca > 90 && k < 1) {
            ultFaisca = now
            const b = el.getBoundingClientRect()
            fx2d.faiscas(b.left + e2 * b.width, b.top + b.height * (0.3 + Math.random() * 0.4), 3, { tipo: 1, forca: 220, vida: 0.5, chao: b.bottom })
          }
          if (k < 1) raf = requestAnimationFrame(passo)
        }
        raf = requestAnimationFrame(passo)
      },
      { threshold: 0.7 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  const gcal = (
    <PressLink key="g" variant="soft" href={googleCalendarUrl(convite)} target="_blank" rel="noopener" className="w-full">
      Google Agenda
    </PressLink>
  )
  const ics = (
    <PressLink key="i" variant="soft" href="/convite.ics" download="missao-joao-lucas.ics" className="w-full">
      {isApple ? 'Agenda do iPhone' : 'Outras agendas (.ics)'}
    </PressLink>
  )
  // sem o link do Maps no config, abre uma busca pelo nome do local
  const mapa = f.linkMapa || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([f.local.replace('·', ''), f.endereco].filter(Boolean).join(' '))}`

  return (
    <section id="missao" aria-labelledby="t-missao" className="wrap secao compacta acc-vermelho">
      <SectionTitle id="t-missao" index={indice('missao')} kicker="Quando e onde" title="A missão" />
      <div className="flex flex-col gap-(--gap)">
        <Card className="reveal">
          <div className="cartao-cab">
            <span className="rotulo t-rotulo acc-txt">Dados da missão</span>
            <span className="mono t-rotulo tracking-[0.18em] txt-2" aria-hidden="true">
              {prog < 1 ? 'DECODIFICANDO' : 'CONFIRMADO'}
            </span>
          </div>
          <div ref={bloco} className="relative overflow-hidden p-(--pad)">
            <p className="sr-only">
              {diaSemana}, {diaMes} de {ano}
              {hora ? `, às ${hora}` : ', horário a definir'}
            </p>
            <div className="grid grid-cols-[1fr_auto] items-end gap-4">
              <div>
                <p className="rotulo t-rotulo">Data</p>
                <Codigo texto={dataCurtaBarra} progresso={prog} className="mono mt-1.5 t-numero leading-none" />
              </div>
              <div className="text-right">
                <p className="rotulo t-rotulo">Horário</p>
                <Codigo texto={hora ?? 'A DEFINIR'} progresso={prog} className="mono mt-1.5 t-numero leading-none" />
              </div>
            </div>
            <p className="mt-2.5 t-forte font-semibold text-branco" aria-hidden="true">
              {diaSemana}, {diaMes}
            </p>
            <div ref={feixe} className="feixe-decod" aria-hidden="true" />
          </div>
        </Card>

        <Card className="reveal">
          <div className="cartao-cab">
            <span className="rotulo t-rotulo acc-txt">Local</span>
            <span className="ico">
              <Icon name="pin" />
            </span>
          </div>
          <div className="flex flex-col gap-(--gap) p-(--pad)">
            <div>
              <p className="display t-destaque text-branco">{f.local}</p>
              <p className="mt-1 t-texto font-medium txt-2">{f.endereco || 'Endereço completo em breve'}</p>
            </div>
            <MapaTatico />
            <div className="flex flex-col gap-2">
              <PressLink href={mapa} target="_blank" rel="noopener" className="w-full">
                <Icon name="seta" size={20} />
                Como chegar
              </PressLink>
              <PressButton variant="soft" className="w-full" aria-expanded={agenda} onClick={() => setAgenda((v) => !v)}>
                <Icon name="mais" size={20} />
                Adicionar à agenda
              </PressButton>
              <AnimatePresence initial={false}>
                {agenda && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                    className="grid grid-cols-1 gap-2 overflow-hidden"
                  >
                    {isApple ? [ics, gcal] : [gcal, ics]}
                    {!f.horarioDefinido && <p className="px-2 text-center t-nota font-medium txt-2">Entra como evento de dia inteiro até o horário ser confirmado.</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
