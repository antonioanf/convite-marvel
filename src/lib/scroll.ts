/**
 * Lenis (scroll suave) + GSAP ScrollTrigger num único relógio (gsap.ticker).
 * No toque mantemos a inércia nativa do celular (syncTouch: false) — é o que fica
 * mais fluido em Android simples e no iOS; o Lenis suaviza roda do mouse/trackpad
 * (desktop na moldura) e mantém o ScrollTrigger sincronizado.
 */
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
// a barra do navegador aparecendo/sumindo não deve recalcular tudo
ScrollTrigger.config({ ignoreMobileResize: true })

let lenis: Lenis | null = null

export function initScroll() {
  if (lenis) return lenis
  lenis = new Lenis({
    autoRaf: false,
    lerp: 0.12,
    smoothWheel: true,
    syncTouch: false,
    touchMultiplier: 1,
  })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis?.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  return lenis
}

export const scroll = {
  get lenis() {
    return lenis
  },
  to(target: string | HTMLElement, offset = -16) {
    if (lenis) lenis.scrollTo(target, { offset, duration: 1.4 })
    else {
      const el = typeof target === 'string' ? document.querySelector(target) : target
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  },
  /** trava a página (lightbox aberto, intro) */
  lock(on: boolean) {
    document.documentElement.classList.toggle('locked', on)
    if (on) lenis?.stop()
    else lenis?.start()
  },
}

export { gsap, ScrollTrigger }
