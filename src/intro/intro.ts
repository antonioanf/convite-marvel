/**
 * Intro: borboleta holográfica + "Toque para abrir".
 * O HTML/CSS já vem no index.html (aparece na hora); aqui só ligamos o toque
 * e a abertura (~0,6 s): as asas abrem e o brilho iridescente dissolve a tela.
 */
import { appState } from '../lib/appState'
import { butterflyBurst, prefersReducedMotion } from '../lib/butterflySvg'
import { vibrate } from '../lib/haptics'
import { music } from '../lib/audio'
import { requestTilt } from '../lib/tilt'
import { debug } from '../lib/debug'
import { loadApp } from '../lib/appLoader'
import { sfx } from '../lib/sfx'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

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
    requestTilt()
    music.start()
    sfx.sparkle()
    vibrate([14, 40, 10])
    el.setAttribute('aria-hidden', 'true')

    // asas abrem + brilho na hora; a tela some assim que o app estiver pronto (sem espera artificial)
    const reduced = prefersReducedMotion()
    el.classList.add('is-open')
    if (!reduced) {
      const bf = el.querySelector('.bf-wrap')!.getBoundingClientRect()
      butterflyBurst({ x: bf.left + bf.width / 2, y: bf.top + bf.height / 2, count: 10, towardCamera: true })
    }
    await ready
    unlock()
    el.classList.add('is-gone')
    // avisa o app no quadro seguinte: o esmaecer já começou (roda no compositor) enquanto o convite se monta
    requestAnimationFrame(() => setTimeout(() => appState.open()))
    await wait(reduced ? 200 : 600)
    el.remove()
  }

  el.addEventListener('click', open)
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') open(e)
  })
}
