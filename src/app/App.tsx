import { lazy, memo, Suspense, useEffect, useState } from 'react'
import { convite } from '../config/convite'
import { useLite, useOpened } from '../hooks/useStores'
import { Mesh } from '../components/effects/Mesh'
import { EffectsLayer } from '../components/effects/EffectsLayer'
import { BottomBar } from '../components/ui/BottomBar'
import { Hero } from '../components/sections/Hero'
import { Destaque } from '../components/sections/Destaque'
import { Countdown } from '../components/sections/Countdown'
import { Details } from '../components/sections/Details'
import { Gallery } from '../components/sections/Gallery'
import { Velinhas } from '../components/sections/Velinhas'
import { Rsvp } from '../components/sections/Rsvp'
import { Pix } from '../components/sections/Pix'
import { Footer } from '../components/sections/Footer'
import { attachFieldInput, field } from '../lib/butterflyField'
import { ProgressBar } from '../components/fun/ProgressBar'
import { CatchCounter } from '../components/fun/CatchCounter'
import { debug } from '../lib/debug'
import { perf } from '../lib/perf'
import { initScroll, gsap, ScrollTrigger } from '../lib/scroll'
import { appState } from '../lib/appState'

// Cena 3D: chunk separado, só baixado depois da intro e se o aparelho aguentar.
const Butterflies3D = lazy(() => import('../components/effects/Butterflies3D'))

/** As seções não dependem de "aberto": ficam memorizadas para a abertura não redesenhar o convite inteiro. */
const Sections = memo(function Sections() {
  const s = convite.secoes
  return (
    <>
      <Hero />
      <Destaque />
      {s.contagem && <Countdown />}
      {s.local && <Details />}
      {s.galeria && <Gallery />}
      {s.velinhas && <Velinhas />}
      {s.rsvp && <Rsvp />}
      {s.pix && convite.pix && <Pix />}
      <Footer />
    </>
  )
})

export function App() {
  const opened = useOpened()
  const lite = useLite()
  const [want3D, setWant3D] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('lite', lite)
    field.configure({ ambient: perf.reducedMotion ? 3 : lite ? 4 : 6, slow: perf.reducedMotion, lite })
  }, [lite])

  useEffect(() => {
    const lenis = initScroll()
    lenis.stop()
    attachFieldInput()
    appState.mounted()
    // animações CSS (chamas, asas dos ícones, brilhos) ficam pausadas nas seções fora da tela
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle('is-offscreen', !e.isIntersecting)),
      { rootMargin: '120px 0px' },
    )
    document.querySelectorAll('.page > section, .page > footer').forEach((el) => io.observe(el))
    // ganchos para os testes automáticos (npm run testes)
    if (import.meta.env.DEV || debug.teste) Object.assign(window, { __convite: { field } })
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!opened) return
    initScroll().start()
    field.start(window.innerWidth / 2, window.innerHeight * 0.42)
    const t = setTimeout(() => setWant3D(true), 300)

    // entrada suave de cada seção ao rolar (só transform/opacity)
    let ctx: gsap.Context | undefined
    if (!perf.reducedMotion) {
      ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
          gsap.fromTo(
            el,
            { opacity: 0, y: 48, scale: 0.94 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 1.1,
              ease: 'expo.out',
              scrollTrigger: { trigger: el, start: 'top 90%', once: true },
            },
          )
        })
      })
    }
    // fotos com parallax dentro da moldura
    if (!perf.reducedMotion) {
      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
        gsap.fromTo(
          el,
          { yPercent: -6 },
          { yPercent: 6, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.6 } },
        )
      })
    }
    const onLoad = () => ScrollTrigger.refresh()
    window.addEventListener('load', onLoad)
    // seções com content-visibility mudam de altura quando são desenhadas: recalcula os gatilhos
    let rt = 0
    const ro = new ResizeObserver(() => {
      clearTimeout(rt)
      rt = window.setTimeout(() => ScrollTrigger.refresh(), 200)
    })
    const page = document.querySelector('.page')
    if (page) ro.observe(page)
    return () => {
      clearTimeout(t)
      clearTimeout(rt)
      ro.disconnect()
      ctx?.revert()
      window.removeEventListener('load', onLoad)
    }
  }, [opened])

  return (
    <>
      <Mesh />
      <ProgressBar />
      <main className="page" aria-hidden={!opened}>
        <Sections />
      </main>
      <EffectsLayer />
      {want3D && !lite && (
        <Suspense fallback={null}>
          <Butterflies3D />
        </Suspense>
      )}
      <BottomBar />
      <CatchCounter />
    </>
  )
}
