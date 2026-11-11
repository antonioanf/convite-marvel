/**
 * Intro: capa de gibi "Você foi convocado!" + "Toque para abrir".
 * O HTML/CSS já vem no index.html (aparece na hora); aqui só ligamos o toque e a abertura (~0,8 s):
 * POW! + trovão, um raio fractal desce exatamente pela linha do rasgo, a capa (duplicada em duas
 * metades) se abre, um segundo raio cai e o convite aparece. Os raios são canvas 2D (o WebGL dos
 * poderes ainda não precisa estar carregado aqui).
 */
import { appState } from '../lib/appState'
import { prefersReducedMotion } from '../lib/perf'
import { vibrate } from '../lib/haptics'
import { som } from '../lib/audio'
import { debug } from '../lib/debug'
import { loadApp } from '../lib/appLoader'
import { sfx } from '../lib/sfx'
import { desenharRaio2D, gerarRaio, type Raio } from '../lib/fx/raio'
import { CLARAO_MAX, podeClarear } from '../lib/fx/clarao'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

// pontos do rasgo (os mesmos do clip-path do index.html), em % da tela
const RASGO = [[51, 0], [46, 7], [54, 14], [47, 22], [53, 30], [45, 38], [52, 46], [47, 54], [55, 62], [46, 70], [53, 78], [47, 86], [52, 93], [49, 100]]

/** Raios do rasgo: o primeiro segue a linha do rasgo de cima a baixo; o segundo cai na diagonal 170 ms depois. */
function raios(el: HTMLElement) {
  const cv = el.querySelector<HTMLCanvasElement>('.cv-raios')
  const flash = el.querySelector<HTMLElement>('.cv-flash')
  if (!cv) return
  const W = innerWidth
  const H = innerHeight
  const dpr = Math.min(1.5, devicePixelRatio || 1)
  cv.width = Math.round(W * dpr)
  cv.height = Math.round(H * dpr)
  cv.style.display = 'block'
  const ctx = cv.getContext('2d')
  if (!ctx) return
  // raio 1: um pedaço fractal entre cada ponto do rasgo, com poucos galhos (todos começam juntos)
  const r1: Raio = { galhos: [], fim: { x: (RASGO[RASGO.length - 1][0] / 100) * W, y: H } }
  for (let i = 1; i < RASGO.length; i++) {
    const a = { x: (RASGO[i - 1][0] / 100) * W, y: (RASGO[i - 1][1] / 100) * H }
    const b = { x: (RASGO[i][0] / 100) * W, y: (RASGO[i][1] / 100) * H }
    r1.galhos.push(...gerarRaio(a, b, { niveis: 4, desvio: 0.16, galhos: i % 3 === 1 ? 0.35 : 0 }).galhos)
  }
  const r2 = gerarRaio({ x: W * 0.12, y: -10 }, { x: W * 0.47, y: H * 0.5 }, { galhos: 1.2, niveis: 8 })
  const r3 = gerarRaio({ x: W * 0.92, y: -10 }, { x: W * 0.56, y: H * 0.36 }, { galhos: 0.8, niveis: 8 })
  const lista: [Raio, number, number][] = [
    [r1, 0, 5],
    [r2, 0.17, 4],
    [r3, 0.3, 3]
  ]
  // clarões azul-claros suaves (limitados a 3/s e nunca branco puro)
  const clarao = (atraso: number, forca: number) =>
    setTimeout(() => {
      if (!flash || !podeClarear()) return
      flash.animate([{ opacity: 0 }, { opacity: CLARAO_MAX * forca, offset: 0.15 }, { opacity: 0 }], { duration: 240, easing: 'ease-out' })
    }, atraso)
  clarao(20, 1)
  clarao(190, 0.75)
  const t0 = performance.now()
  const frame = (now: number) => {
    const t = (now - t0) / 1000
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    for (const [r, ini, lw] of lista) desenharRaio2D(ctx, r, t - ini, lw)
    if (t < 0.8) requestAnimationFrame(frame)
    else cv.style.display = 'none'
  }
  requestAnimationFrame(frame)
}

function unlock() {
  document.documentElement.classList.remove('locked', 'pre')
}

export function initIntro() {
  const el = document.getElementById('intro')
  if (!el) {
    unlock()
    appState.open()
    return
  }
  if (debug.abrir) {
    el.remove()
    unlock()
    appState.open()
    return
  }
  // O app é montado ATRÁS da intro assim que o celular fica livre (depois do load),
  // em pedacinhos (startTransition no mount). No toque ele normalmente já está pronto.
  const preload = () => void loadApp()
  el.addEventListener('pointerdown', preload, { once: true, passive: true })
  // só depois da intro estar pintada (2 quadros), para a primeira pintura não esperar o app
  const idle = () =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => ('requestIdleCallback' in window ? requestIdleCallback(preload, { timeout: 2500 }) : setTimeout(preload, 600))),
    )
  if (document.readyState === 'complete') idle()
  else window.addEventListener('load', idle, { once: true })

  let started = false
  const open = async (e?: Event) => {
    if (started) return
    started = true
    e?.preventDefault()
    const ready = loadApp()
    // Tudo que precisa de "gesto do usuário" acontece aqui, de forma síncrona:
    som.start()
    sfx.pow()
    sfx.thunder()
    vibrate([30, 30, 60, 40, 30])
    el.setAttribute('aria-hidden', 'true')

    const reduced = prefersReducedMotion()
    if (reduced) el.classList.add('rm')
    else {
      // metade direita = cópia da capa (a esquerda é a original); o CSS recorta as duas no rasgo
      const left = el.querySelector('.cv-l')!
      const right = left.cloneNode(true) as HTMLElement
      right.classList.replace('cv-l', 'cv-r')
      left.after(right)
      raios(el)
    }
    el.classList.add('is-open')
    await ready
    unlock()
    // avisa o app no quadro seguinte: o rasgo já começou (roda no compositor) enquanto o convite entra
    requestAnimationFrame(() => setTimeout(() => appState.open()))
    // a tempestade se dissipa e revela o convite; a intro sai do DOM em ~0,8 s
    await wait(reduced ? 300 : 540)
    el.classList.add('is-gone')
    await wait(reduced ? 150 : 250)
    el.remove()
  }

  el.addEventListener('click', open)
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') open(e)
  })
}
