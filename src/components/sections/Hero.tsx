import { useEffect, useRef } from 'react'
import { motion, type Variants } from 'framer-motion'
import { convite } from '../../config/convite'
import { useOpened } from '../../hooks/useStores'
import { HoloPhoto } from '../ui/HoloPhoto'
import { gsap, ScrollTrigger } from '../../lib/scroll'
import { perf } from '../../lib/perf'
import { useHolo } from '../../lib/holo'
import { dataCurta } from '../../lib/datas'

const ease = [0.2, 0.8, 0.2, 1] as const

const fade: Variants = {
  hide: { opacity: 0, y: 16 },
  show: (d: number) => ({ opacity: 1, y: 0, transition: { delay: d, duration: 0.8, ease } }),
}

const letter: Variants = {
  hide: { opacity: 0, y: '0.4em', rotate: 8 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: { delay: 0.55 + i * 0.07, type: 'spring', stiffness: 260, damping: 20 },
  }),
}

/** Nome aparecendo letra por letra (decorativo; o texto real fica para leitores de tela). */
function Letters({ text, offset, anim }: { text: string; offset: number; anim: string }) {
  return (
    <>
      {[...text].map((ch, i) => (
        <motion.span key={i} className="ch" custom={offset + i} variants={letter} initial={perf.reducedMotion ? false : 'hide'} animate={anim}>
          {ch === ' ' ? ' ' : ch}
        </motion.span>
      ))}
    </>
  )
}

/** Selo redondo com a idade holográfica e um anel de texto girando. */
function Sticker({ anim }: { anim: string }) {
  const num = useRef<HTMLSpanElement>(null)
  useHolo(num)
  const c = convite.crianca
  const ring = `${c.nome} · ${c.idade} aninhos · ${dataCurta.replace(/ /g, '')} · `
  return (
    <motion.div
      initial={perf.reducedMotion ? false : { scale: 0, rotate: -40 }}
      animate={anim === 'show' ? { scale: 1, rotate: -8 } : undefined}
      transition={{ delay: 1.05, type: 'spring', stiffness: 220, damping: 14 }}
      className="sticker absolute -right-1.5 -top-3 z-10 size-[clamp(90px,26vw,104px)]"
    >
      <svg viewBox="0 0 100 100" className="sticker-spin absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <path id="ring" d="M50,50 m-39,0 a39,39 0 1,1 78,0 a39,39 0 1,1 -78,0" />
        </defs>
        <text fontFamily="var(--font-mono)" fontSize="7.4" fill="var(--color-tinta-2)">
          <textPath href="#ring" textLength="242" lengthAdjust="spacing">{ring.toUpperCase()}</textPath>
        </text>
      </svg>
      <p className="relative flex flex-col items-center leading-none">
        <span ref={num} className="holo-text serif text-[54px] leading-[0.8]" data-holo>
          {c.idade}
        </span>
        <span className="sr-only"> {c.idade === 1 ? 'aninho' : 'aninhos'}</span>
      </p>
    </motion.div>
  )
}

export function Hero() {
  const opened = useOpened()
  const section = useRef<HTMLElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const img = useRef<HTMLDivElement>(null)
  const c = convite.crianca
  const anim = opened ? 'show' : 'hide'

  // parallax: a foto desliza dentro da moldura e a moldura sobe um pouco ao rolar
  useEffect(() => {
    if (!opened || perf.reducedMotion) return
    const ctx = gsap.context(() => {
      const st = { trigger: section.current, start: 'top top', end: 'bottom top', scrub: 0.5 }
      gsap.fromTo(img.current, { yPercent: -3 }, { yPercent: 5, ease: 'none', scrollTrigger: st })
      gsap.to(frame.current, { y: -30, scale: 0.97, ease: 'none', scrollTrigger: st })
      gsap.to(document.querySelector('.mesh-inner'), {
        yPercent: -8,
        ease: 'none',
        scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1 },
      })
    }, section)
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    return () => ctx.revert()
  }, [opened])

  return (
    <section
      ref={section}
      id="inicio"
      aria-label={`Convite de aniversário de ${c.nome}`}
      className="relative pb-12 pt-[max(14px,env(safe-area-inset-top))]"
    >
      <div className="wrap">
        <motion.div custom={0.1} variants={fade} initial="hide" animate={anim} className="flex items-center justify-end px-1">
          <span className="label">{dataCurta}</span>
        </motion.div>

        <motion.div
          ref={frame}
          initial={perf.reducedMotion ? false : { opacity: 0, scale: 0.92, y: 30 }}
          animate={opened ? { opacity: 1, scale: 1, y: 0 } : undefined}
          transition={{ delay: 0.15, type: 'spring', stiffness: 120, damping: 20 }}
          className="relative mt-4"
        >
          <HoloPhoto
            foto={convite.fotoPrincipal}
            eager
            sizes="(max-width: 480px) 92vw, 450px"
            perch="0.03,0.12,-35;0.985,0.46,32;0.28,0.0,6"
            imgRef={img}
            className="aspect-[358/470] rounded-[32px]"
          >
            <div className="hero-fade" />
            <h1 className="hero-name absolute inset-x-5 bottom-3 whitespace-nowrap text-[clamp(56px,18.5vw,80px)] leading-[1]">
              <span className="sr-only">{c.nome}</span>
              <span aria-hidden="true">
                <Letters text={c.nome} offset={0} anim={anim} />
              </span>
            </h1>
          </HoloPhoto>
          <Sticker anim={anim} />
        </motion.div>

        <motion.p custom={1.2} variants={fade} initial="hide" animate={anim} className="mt-6 px-1 text-[19px] font-semibold leading-snug text-roxo">
          {c.frase}
        </motion.p>
        <motion.div custom={1.4} variants={fade} initial="hide" animate={anim} className="mt-3 flex items-center justify-between px-1">
          <span className="label">Toque nas borboletas ✨</span>
          <span className="label flex items-center gap-1.5" aria-hidden="true">
            Role
            <svg className="nudge" width="14" height="14" viewBox="0 0 24 24">
              <path d="M12 5v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </motion.div>
      </div>
    </section>
  )
}
