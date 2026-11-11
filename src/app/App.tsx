import { memo, useEffect } from 'react'
import { useLite, useOpened } from '../hooks/useStores'
import { Cena } from '../components/cena/Cena'
import { Hero } from '../components/hero/Hero'
import { Countdown } from '../components/sections/Countdown'
import { Missao } from '../components/sections/Missao'
import { Poderes } from '../components/sections/Poderes'
import { Rsvp } from '../components/sections/Rsvp'
import { Pix } from '../components/sections/Pix'
import { Footer } from '../components/sections/Footer'
import { BottomBar } from '../components/ui/BottomBar'
import { ProgressBar } from '../components/fun/ProgressBar'
import { convite } from '../config/convite'
import { perf } from '../lib/perf'
import { initScroll, gsap, ScrollTrigger } from '../lib/scroll'
import { appState } from '../lib/appState'
import { iniciarGestos } from '../poderes/gestos'
import { debug } from '../lib/debug'
import { poderes } from '../poderes/estado'
import { acionar, carregarMotor } from '../poderes/acionar'

const s = convite.secoes

/** As seções não dependem de "aberto": ficam memorizadas para a abertura não redesenhar o convite inteiro. */
const Sections = memo(function Sections() {
  return (
    <>
      <Hero />
      {s.contagem && <Countdown />}
      {s.local && <Missao />}
      {s.poderes && <Poderes />}
      {s.rsvp && <Rsvp />}
      {s.pix && convite.pix && <Pix />}
      <Footer />
    </>
  )
})

export function App() {
  const opened = useOpened()
  const lite = useLite()

  useEffect(() => {
    document.documentElement.classList.toggle('lite', lite)
  }, [lite])

  useEffect(() => {
    const lenis = initScroll()
    lenis.stop()
    appState.mounted()
    // animações CSS das seções fora da tela ficam pausadas (pausa centralizada aqui)
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle('is-offscreen', !e.isIntersecting)),
      { rootMargin: '120px 0px' },
    )
    document.querySelectorAll('.page > section, .page > footer').forEach((el) => io.observe(el))
    // testes automáticos
    if (debug.teste) Object.assign(window, { __convite: { poderes, acionar, carregarMotor } })
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!opened) return
    initScroll().start()
    iniciarGestos()
    let ctx: gsap.Context | undefined
    if (!perf.reducedMotion) {
      ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
          gsap.fromTo(el, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } })
        })
      })
    }
    let rt = 0
    const ro = new ResizeObserver(() => {
      clearTimeout(rt)
      rt = window.setTimeout(() => ScrollTrigger.refresh(), 200)
    })
    const page = document.querySelector('.page')
    if (page) ro.observe(page)
    return () => {
      clearTimeout(rt)
      ro.disconnect()
      ctx?.revert()
    }
  }, [opened])

  return (
    <>
      <Cena />
      <ProgressBar />
      <main className="page" aria-hidden={!opened}>
        <Sections />
      </main>
      <BottomBar />
    </>
  )
}
