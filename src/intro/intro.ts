/**
 * Abertura de cinema: noite de tempestade, chuva caindo, um relâmpago ilumina por um instante o
 * emblema JL de metal e aparece "VOCÊ FOI CONVOCADO". O HTML/CSS vem no index.html (aparece na hora);
 * aqui ligamos a chuva e os relâmpagos (canvas 2D) e o toque:
 *   0 ms     um raio cai do céu e atinge o emblema (trovão com eco + vibração + clarão azul suave)
 *   ~60 ms   o metal fica incandescente
 *   ~200 ms  a luz quente se abre a partir do emblema
 *   ~540 ms  a abertura esmaece e revela o convite (já montado atrás); ~800 ms sai do DOM
 */
import { appState } from '../lib/appState'
import { perf, prefersReducedMotion } from '../lib/perf'
import { vibrate } from '../lib/haptics'
import { som } from '../lib/audio'
import { mostrarDicaSom } from '../lib/dicaSom'
import { debug } from '../lib/debug'
import { loadApp } from '../lib/appLoader'
import { sfx } from '../lib/sfx'
import { desenharRaio2D, gerarRaio, type Raio } from '../lib/fx/raio'
import { CLARAO_MAX, podeClarear } from '../lib/fx/clarao'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function unlock() {
  document.documentElement.classList.remove('locked', 'pre')
}

interface Gota {
  x: number
  y: number
  v: number
  len: number
  w: number
  a: number
}

/** Chuva (duas profundidades) + relâmpagos. Devolve o controle para o toque. */
function tempestade(el: HTMLElement) {
  const fundo = el.querySelector<HTMLCanvasElement>('.in-fundo')!
  const frente = el.querySelector<HTMLCanvasElement>('.in-frente')!
  const flash = el.querySelector<HTMLElement>('.in-relampago')!
  const sombra = el.querySelector<HTMLElement>('.in-sombra')!
  const cf = fundo.getContext('2d')!
  const cr = frente.getContext('2d')!
  const dpr = Math.min(1.25, devicePixelRatio || 1)
  let W = 0
  let H = 0
  const resize = () => {
    W = innerWidth
    H = innerHeight
    for (const c of [fundo, frente]) {
      c.width = Math.round(W * dpr)
      c.height = Math.round(H * dpr)
    }
  }
  resize()
  addEventListener('resize', resize)

  // vento: as gotas caem inclinadas (~13°)
  const vento = 0.23
  const nova = (perto: boolean, y?: number): Gota => ({
    x: Math.random() * (W + 120) - 60,
    y: y ?? Math.random() * H,
    v: perto ? 1300 + Math.random() * 500 : 700 + Math.random() * 350,
    len: perto ? 26 + Math.random() * 22 : 10 + Math.random() * 12,
    w: perto ? 1.1 + Math.random() * 0.6 : 0.6 + Math.random() * 0.4,
    a: perto ? 0.16 + Math.random() * 0.14 : 0.08 + Math.random() * 0.1,
  })
  const lite = perf.isLite()
  const longe = Array.from({ length: lite ? 50 : 90 }, () => nova(false))
  const perto = Array.from({ length: lite ? 22 : 40 }, () => nova(true))

  // raios ativos
  const raios: { r: Raio; t0: number; lw: number; frente: boolean }[] = []
  let brilho = 0 // quanto a chuva "acende" no relâmpago
  let rodando = true
  let ultimo = performance.now()

  const clarao = (forca: number) => {
    if (!podeClarear()) return
    flash.animate(
      [{ opacity: 0 }, { opacity: CLARAO_MAX * forca, offset: 0.12 }, { opacity: CLARAO_MAX * forca * 0.3, offset: 0.3 }, { opacity: CLARAO_MAX * forca * 0.8, offset: 0.42 }, { opacity: 0 }],
      { duration: 520, easing: 'ease-out' },
    )
    brilho = 1
  }

  /** Relâmpago distante (atrás do emblema): ilumina o metal por um instante. */
  const distante = () => {
    const x0 = W * (0.15 + Math.random() * 0.7)
    raios.push({
      r: gerarRaio({ x: x0, y: -10 }, { x: x0 + (Math.random() - 0.5) * W * 0.4, y: H * (0.45 + Math.random() * 0.25) }, { niveis: 8, galhos: 1.3 }),
      t0: performance.now() / 1000,
      lw: 1.6,
      frente: false,
    })
    clarao(0.55)
    sombra.animate([{ opacity: 0.42 }, { opacity: 0.02, offset: 0.06 }, { opacity: 0.3, offset: 0.14 }, { opacity: 0.08, offset: 0.2 }, { opacity: 0.42 }], { duration: 1400, easing: 'ease-out' })
    sfx.trovao(0.2) // só toca se o som já estiver liberado (depois do toque)
  }

  const desenhaChuva = (ctx: CanvasRenderingContext2D, gotas: Gota[], dt: number, b: number) => {
    ctx.lineCap = 'round'
    for (const g of gotas) {
      g.y += g.v * dt
      g.x += g.v * vento * dt
      if (g.y - g.len > H) Object.assign(g, nova(g.len > 24, -g.len - Math.random() * 60))
      const a = Math.min(0.9, g.a * (1 + b * 2.2))
      ctx.strokeStyle = `rgba(190,210,240,${a.toFixed(3)})`
      ctx.lineWidth = g.w
      ctx.beginPath()
      ctx.moveTo(g.x, g.y)
      ctx.lineTo(g.x - g.len * vento, g.y - g.len)
      ctx.stroke()
    }
  }

  const frame = (now: number) => {
    if (!rodando) return
    requestAnimationFrame(frame)
    const dt = Math.min(0.05, (now - ultimo) / 1000)
    ultimo = now
    brilho *= Math.exp(-dt * 5)
    const t = now / 1000
    for (const [ctx, gotas, deFrente] of [
      [cf, longe, false],
      [cr, perto, true],
    ] as const) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      if (!prefersReducedMotion()) desenhaChuva(ctx, gotas, dt, brilho)
      for (let i = raios.length - 1; i >= 0; i--) {
        const r = raios[i]
        if (r.frente !== deFrente) continue
        if (t - r.t0 > 0.9) {
          raios.splice(i, 1)
          continue
        }
        desenharRaio2D(ctx, r.r, t - r.t0, r.lw)
      }
    }
  }
  requestAnimationFrame(frame)

  // o primeiro relâmpago acontece junto com a animação CSS que ilumina o emblema (0,55 s)
  const timers: number[] = []
  if (!prefersReducedMotion()) {
    timers.push(window.setTimeout(distante, 550))
    const agenda = () => timers.push(window.setTimeout(() => (distante(), agenda()), 4800 + Math.random() * 3600))
    agenda()
  }

  return {
    /** O raio que atinge o emblema (no toque). */
    golpe() {
      const emb = el.querySelector('.in-emblema')!.getBoundingClientRect()
      const alvo = { x: emb.left + emb.width / 2, y: emb.top + emb.height * 0.12 }
      raios.push({ r: gerarRaio({ x: alvo.x + (Math.random() - 0.5) * W * 0.3, y: -20 }, alvo, { niveis: 8, galhos: 1.6 }), t0: performance.now() / 1000, lw: 4.2, frente: true })
      setTimeout(
        () => raios.push({ r: gerarRaio({ x: W * 0.85, y: -20 }, { x: W * 0.62, y: H * 0.42 }, { niveis: 8, galhos: 0.9 }), t0: performance.now() / 1000, lw: 2.2, frente: false }),
        170,
      )
      clarao(1)
    },
    parar() {
      rodando = false
      timers.forEach(clearTimeout)
      removeEventListener('resize', resize)
    },
  }
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
  const storm = tempestade(el)

  // O app é montado ATRÁS da abertura assim que o celular fica livre (depois do load),
  // em pedacinhos (startTransition no mount). No toque ele normalmente já está pronto.
  const preload = () => void loadApp()
  el.addEventListener('pointerdown', preload, { once: true, passive: true })
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
    const t0 = performance.now()
    const ready = loadApp()
    // Tudo que precisa de "gesto do usuário" acontece aqui, de forma síncrona:
    som.start()
    sfx.trovao(1)
    el.setAttribute('aria-hidden', 'true')
    const reduced = prefersReducedMotion()
    if (!reduced) {
      vibrate([40, 30, 90, 40, 30])
      storm.golpe()
    }
    el.classList.add('is-open')
    await ready
    unlock()
    // avisa o app no quadro seguinte: as entradas do hero começam por baixo da luz
    requestAnimationFrame(() => setTimeout(() => appState.open()))
    await wait(Math.max(0, (reduced ? 250 : 560) - (performance.now() - t0)))
    el.classList.add('is-gone')
    await wait(reduced ? 300 : 260)
    storm.parar()
    el.remove()
    // iPhone: a chave de silencioso corta o som — dica uma vez só, com o convite já aberto
    mostrarDicaSom(1400)
  }

  // iPhone: o áudio destrava já no touchend do toque de abertura (antes do click), de forma síncrona
  el.addEventListener('touchend', () => som.start(), { passive: true })
  el.addEventListener('click', open)
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') open(e)
  })
}
