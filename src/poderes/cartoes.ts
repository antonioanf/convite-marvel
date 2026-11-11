/**
 * Os poderes mexendo no convite: tremor da tela, ondulação, levitação e a "lente" do portal puxando
 * os cartões. Só transform, via as propriedades individuais `translate`/`rotate`/`scale` (Web
 * Animations): não brigam com o `transform` das entradas do GSAP e não forçam layout a cada quadro.
 */
import type { Pt } from '../lib/fx/raio'

const pagina = () => document.querySelector<HTMLElement>('.page')

/** Cartões que estão (ao menos em parte) na tela, com o retângulo medido uma vez. */
export function cartoesVisiveis(max = 10) {
  const H = innerHeight
  const out: { el: HTMLElement; r: DOMRect }[] = []
  for (const el of document.querySelectorAll<HTMLElement>('.page .cartao')) {
    const r = el.getBoundingClientRect()
    if (r.bottom > 0 && r.top < H && r.width > 0) out.push({ el, r })
    if (out.length >= max) break
  }
  return out
}

/** A tela treme (a página toda), forte no começo e amortecendo. */
export function tremer(forca: number, ms = 600) {
  const el = pagina()
  if (!el) return
  const n = 10
  const kf: Keyframe[] = []
  for (let i = 0; i <= n; i++) {
    const k = 1 - i / n
    const a = forca * k * k
    kf.push({ translate: i === n ? '0 0' : `${((Math.random() - 0.5) * 2 * a).toFixed(1)}px ${((Math.random() - 0.5) * 2 * a).toFixed(1)}px` })
  }
  el.animate(kf, { duration: ms, easing: 'linear' })
}

/** Onda passando pelos cartões a partir de `p` (cada um "pula" quando a frente da onda chega). */
export function ondular(p: Pt, vel = 900, forca = 10) {
  for (const { el, r } of cartoesVisiveis()) {
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const dx = cx - p.x
    const dy = cy - p.y
    const d = Math.hypot(dx, dy) || 1
    const a = forca * Math.max(0.25, 1 - d / 900)
    el.animate(
      [
        { translate: '0 0', scale: '1' },
        { translate: `${((dx / d) * a).toFixed(1)}px ${((dy / d) * a).toFixed(1)}px`, scale: '1.012', offset: 0.28 },
        { translate: `${((-dx / d) * a * 0.3).toFixed(1)}px ${((-dy / d) * a * 0.3).toFixed(1)}px`, scale: '0.997', offset: 0.6 },
        { translate: '0 0', scale: '1' },
      ],
      { duration: 620, delay: (d / vel) * 1000, easing: 'ease-out' },
    )
  }
}

const levitando = new Map<HTMLElement, Animation>()
/** Magia: os cartões flutuam e giram de leve; `false` devolve todos ao lugar. */
export function levitar(on: boolean) {
  if (on) {
    cartoesVisiveis(6).forEach(({ el }, i) => {
      if (levitando.has(el)) return
      const s = i % 2 ? 1 : -1
      const a = el.animate(
        [
          { translate: '0 0', rotate: '0deg' },
          { translate: `0 ${-10 - (i % 3) * 3}px`, rotate: `${s * 1.4}deg`, offset: 0.5 },
          { translate: `0 ${-6 - (i % 3) * 2}px`, rotate: `${s * -0.6}deg` },
        ],
        { duration: 1400 + i * 120, easing: 'ease-in-out', fill: 'forwards', direction: 'alternate', iterations: Infinity },
      )
      levitando.set(el, a)
    })
  } else {
    for (const [el, a] of levitando) {
      const cs = getComputedStyle(el)
      const de = { translate: cs.translate === 'none' ? '0 0' : cs.translate, rotate: cs.rotate === 'none' ? '0deg' : cs.rotate }
      a.cancel()
      el.animate([de, { translate: '0 0', rotate: '0deg' }], { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)' })
    }
    levitando.clear()
  }
}

/** Portal aberto: os cartões perto do centro são puxados de leve (como por uma lente/gravidade). */
export function puxar(c: Pt, raio: number, ms: number) {
  for (const { el, r } of cartoesVisiveis()) {
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const dx = c.x - cx
    const dy = c.y - cy
    const d = Math.hypot(dx, dy) || 1
    const k = Math.max(0, 1 - d / (raio * 4))
    if (k <= 0) continue
    const a = 14 * k
    el.animate(
      [
        { translate: '0 0', scale: '1', rotate: '0deg' },
        { translate: `${((dx / d) * a).toFixed(1)}px ${((dy / d) * a).toFixed(1)}px`, scale: `${1 - 0.03 * k}`, rotate: `${(dx > 0 ? 1 : -1) * 0.8 * k}deg`, offset: 0.25 },
        { translate: `${((dx / d) * a).toFixed(1)}px ${((dy / d) * a).toFixed(1)}px`, scale: `${1 - 0.03 * k}`, rotate: `${(dx > 0 ? 1 : -1) * 0.8 * k}deg`, offset: 0.8 },
        { translate: '0 0', scale: '1', rotate: '0deg' },
      ],
      { duration: ms, easing: 'ease-in-out' },
    )
  }
}

/** Por um instante, a luz do poder acende as bordas dos cartões em volta (cor "r g b"). */
let luzT = 0
export function iluminar(rgb: string, ms = 260) {
  const h = document.documentElement
  h.style.setProperty('--luz-rgb', rgb)
  h.classList.add('luz-poder')
  clearTimeout(luzT)
  luzT = window.setTimeout(() => h.classList.remove('luz-poder'), ms)
}
