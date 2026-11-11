/**
 * Comemoração: borboletas + confete nas cores da paleta.
 *  - 'leve'   → raspadinha, pegar 10 borboletas
 *  - 'grande' → confirmar presença, apagar as velinhas (a tela inteira solta borboletas)
 * O canvas-confetti só é baixado na primeira comemoração.
 */
import { convite } from '../config/convite'
import { field } from './butterflyField'
import { perf } from './perf'

export async function celebrate(origin: Element | { x: number; y: number } | null, size: 'leve' | 'grande' = 'leve') {
  let x = innerWidth / 2
  let y = innerHeight / 2
  if (origin instanceof Element) {
    const r = origin.getBoundingClientRect()
    x = r.left + r.width / 2
    y = r.top + r.height / 2
  } else if (origin) {
    ;({ x, y } = origin)
  }
  const lite = perf.isLite()
  field.burst(x, y, size === 'grande' ? (lite ? 4 : 7) : lite ? 2 : 3)
  if (size === 'grande' && !perf.reducedMotion) {
    // revoada pela tela inteira
    setTimeout(() => field.burst(innerWidth * 0.15, innerHeight * 0.75, lite ? 2 : 4), 180)
    setTimeout(() => field.burst(innerWidth * 0.85, innerHeight * 0.7, lite ? 2 : 4), 320)
  }
  if (perf.reducedMotion) return
  const { default: confetti } = await import('canvas-confetti')
  const p = convite.paleta
  const colors = [p.violeta, p.lilas, p.lavanda, p.rosa, p.magenta, p.holoCiano, p.holoRosa, '#ffffff']
  const o = { x: x / innerWidth, y: y / innerHeight }
  const base = { colors, disableForReducedMotion: true, zIndex: 95, scalar: 1, ticks: 160 }
  if (size === 'leve') {
    confetti({ ...base, particleCount: lite ? 30 : 50, spread: 70, startVelocity: 32, origin: o })
    return
  }
  confetti({ ...base, particleCount: lite ? 60 : 110, spread: 85, startVelocity: 46, origin: o })
  setTimeout(() => confetti({ ...base, particleCount: lite ? 30 : 50, angle: 60, spread: 60, origin: { x: 0, y: 0.75 } }), 220)
  setTimeout(() => confetti({ ...base, particleCount: lite ? 30 : 50, angle: 120, spread: 60, origin: { x: 1, y: 0.75 } }), 380)
}
