/**
 * Intro: capa de gibi "Você recebeu uma missão!" + "Toque para abrir".
 * O HTML/CSS já vem no index.html (aparece na hora); aqui só ligamos o toque e a abertura:
 * a capa é duplicada (metade esquerda + metade direita) e rasga ao meio com um "POW!" (~0,55 s).
 */
import { appState } from '../lib/appState'
import { prefersReducedMotion } from '../lib/perf'
import { vibrate } from '../lib/haptics'
import { som } from '../lib/audio'
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
    som.start()
    sfx.pow()
    vibrate([18, 40, 30])
    el.setAttribute('aria-hidden', 'true')

    const reduced = prefersReducedMotion()
    if (reduced) el.classList.add('rm')
    else {
      // metade direita = cópia da capa (a esquerda é a original); o CSS recorta as duas no rasgo
      const left = el.querySelector('.cv-l')!
      const right = left.cloneNode(true) as HTMLElement
      right.classList.replace('cv-l', 'cv-r')
      left.after(right)
    }
    el.classList.add('is-open')
    await ready
    unlock()
    // avisa o app no quadro seguinte: o rasgo já começou (roda no compositor) enquanto o convite entra
    requestAnimationFrame(() => setTimeout(() => appState.open()))
    await wait(reduced ? 450 : 620)
    el.remove()
  }

  el.addEventListener('click', open)
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') open(e)
  })
}
