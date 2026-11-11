import { useEffect, useRef, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { convite } from '../../config/convite'
import { useOpened } from '../../hooks/useStores'
import { gsap } from '../../lib/scroll'
import { perf } from '../../lib/perf'
import { dataTrailer } from '../../lib/datas'
import { fx2d } from '../../lib/fx/camada2d'
import { sfx } from '../../lib/sfx'
import { vibrate } from '../../lib/haptics'
import { Selo } from './Selo'
import { TituloEletrico, type TituloHandle } from './TituloEletrico'

const ease = [0.2, 0.8, 0.2, 1] as const
const surge: Variants = {
  hide: { opacity: 0, y: 14 },
  show: (d: number) => ({ opacity: 1, y: 0, transition: { delay: d, duration: 1.1, ease } }),
}

/**
 * Hero: "UMA NOVA MISSÃO", o selo de metal, o título metálico com eletricidade correndo
 * (atingido por um raio quando aparece), a data e a frase.
 */
export function Hero() {
  const opened = useOpened()
  const c = convite.crianca
  const section = useRef<HTMLElement>(null)
  const titulo = useRef<TituloHandle>(null)
  const caixa = useRef<HTMLDivElement>(null)
  const [aceso, setAceso] = useState(perf.reducedMotion)
  const [visivel, setVisivel] = useState(true)
  const anim = opened ? 'show' : 'hide'

  // o título aparece atingido por um raio (~0,7 s depois de o convite abrir)
  useEffect(() => {
    if (!opened || perf.reducedMotion) return
    const id = setTimeout(() => {
      const r = titulo.current?.svg()?.getBoundingClientRect()
      if (r) {
        const alvo = { x: r.left + r.width * (0.35 + Math.random() * 0.3), y: r.top + r.height * 0.18 }
        fx2d.raio({ x: alvo.x + (Math.random() - 0.5) * 140, y: -20 }, alvo, { lw: 3.6, galhos: 1.4 })
        fx2d.faiscas(alvo.x, alvo.y, 26, { tipo: 0, forca: 380, chao: r.top + r.height * 0.55, vida: 0.9 })
        fx2d.clarao(0.8)
      }
      sfx.trovao(0.9)
      vibrate([30, 30, 60])
      setAceso(true)
      titulo.current?.acender()
    }, 700)
    return () => clearTimeout(id)
  }, [opened])

  // eletricidade só roda com o hero na tela
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisivel(e.isIntersecting))
    if (section.current) io.observe(section.current)
    return () => io.disconnect()
  }, [])

  // "câmera" se afasta levemente ao rolar (só transform)
  useEffect(() => {
    if (!opened || perf.reducedMotion) return
    const ctx = gsap.context(() => {
      gsap.to(caixa.current, { y: -40, scale: 0.94, opacity: 0.35, ease: 'none', scrollTrigger: { trigger: section.current, start: 'top top', end: 'bottom top', scrub: 0.6 } })
    }, section)
    return () => ctx.revert()
  }, [opened])

  return (
    <section ref={section} id="inicio" aria-labelledby="t-inicio" className="hero wrap pb-16 pt-[max(28px,env(safe-area-inset-top))]">
      <div ref={caixa} className="text-center">
        <motion.p custom={0.1} variants={surge} initial="hide" animate={anim} className="rotulo pl-[.42em]">
          Uma nova missão
        </motion.p>

        <motion.div
          initial={perf.reducedMotion ? false : { opacity: 0, scale: 0.86 }}
          animate={opened ? { opacity: 1, scale: 1 } : undefined}
          transition={{ delay: 0.15, duration: 1.4, ease }}
          className="mt-7"
        >
          <Selo />
        </motion.div>

        <h1 id="t-inicio" className="relative mt-7">
          <span className="sr-only">
            {c.nome} · {c.idade} anos
          </span>
          <div ref={undefined} style={{ opacity: aceso ? 1 : 0, transition: 'opacity .08s' }}>
            <TituloEletrico ref={titulo} nome={c.nome.toLocaleUpperCase('pt-BR')} idade={`${c.idade} ANOS`} ativo={aceso && visivel} />
          </div>
        </h1>

        <motion.p custom={1.25} variants={surge} initial="hide" animate={anim} className="rotulo rotulo-eletrico mt-6 pl-[.42em] text-[13px]">
          {dataTrailer}
        </motion.p>
        <motion.p custom={1.4} variants={surge} initial="hide" animate={anim} className="mt-2 text-[14px] font-medium tracking-[0.08em] txt-2">
          {convite.festa.local}
        </motion.p>
        <motion.p custom={1.6} variants={surge} initial="hide" animate={anim} className="mx-auto mt-7 max-w-[26ch] text-[18px] font-medium leading-snug text-branco">
          {c.frase}
        </motion.p>
        <motion.div custom={2} variants={surge} initial="hide" animate={anim} className="mt-10" aria-hidden="true">
          <span className="rotulo text-[10px]">Role</span>
          <span className="role mt-3" />
        </motion.div>
      </div>
    </section>
  )
}
