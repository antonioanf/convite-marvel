import { memo, useEffect } from 'react'
import { useLite, useOpened } from '../hooks/useStores'
import { Cena } from '../components/cena/Cena'
import { Hero } from '../components/hero/Hero'
import { BottomBar } from '../components/ui/BottomBar'
import { ProgressBar } from '../components/fun/ProgressBar'
import { perf } from '../lib/perf'
import { initScroll, gsap, ScrollTrigger } from '../lib/scroll'
import { appState } from '../lib/appState'

/** As seções não dependem de "aberto": ficam memorizadas para a abertura não redesenhar o convite inteiro. */
const Sections = memo(function Sections() {
  return (
    <>
      <Hero />
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
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!opened) return
    initScroll().start()
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
