/**
 * Porta de entrada dos poderes (pacote principal, pequena): carrega o motor (chunk separado) só
 * quando precisa, mantém a ordem dos comandos enquanto ele carrega e, com prefers-reduced-motion,
 * troca tudo por um brilho suave e colorido no ponto (sem tremor, clarão nem partículas).
 */
import type { Motor } from './motor'
import { PODERES, infoPoder, type PoderId } from './catalogo'
import { poderes } from './estado'
import type { Pt } from '../lib/fx/raio'
import { perf } from '../lib/perf'

let motorP: Promise<Motor | null> | null = null
let motor: Motor | null = null

/** Baixa e liga o motor (uma vez). Chamado perto da seção PODERES ou no primeiro gesto. */
export function carregarMotor() {
  if (perf.reducedMotion) return Promise.resolve(null)
  return (motorP ??= import('./motor')
    .then((m) => (motor = m.criarMotor((id) => poderes.marcar(id))))
    .catch((e) => {
      console.warn('[convite] motor dos poderes indisponível', e)
      return null
    }))
}

// fila: os comandos de um mesmo gesto chegam na ordem certa mesmo antes do motor carregar
let fila: Promise<unknown> = Promise.resolve()
function comMotor(fn: (m: Motor) => void) {
  if (motor) {
    fn(motor)
    return
  }
  fila = fila.then(carregarMotor).then((m) => m && fn(m))
}

/** Movimento reduzido: só uma luz colorida macia que acende e apaga no ponto. */
export function brilhoSuave(p: Pt, id: PoderId) {
  const el = document.createElement('div')
  el.className = 'brilho-suave'
  el.setAttribute('aria-hidden', 'true')
  el.style.left = `${p.x}px`
  el.style.top = `${p.y}px`
  el.style.setProperty('--c', infoPoder(id).rgb)
  document.body.append(el)
  el.animate([{ opacity: 0 }, { opacity: 1, offset: 0.35 }, { opacity: 0 }], { duration: 1600, easing: 'ease-in-out' }).finished.finally(() => el.remove())
}

const suave = (p: Pt, id: PoderId) => {
  brilhoSuave(p, id)
  poderes.marcar(id)
}
const centro = () => ({ x: innerWidth / 2, y: innerHeight * 0.45 })

let pontoCarga: Pt | null = null
let magiaSuave = false
let pontoCosmico: Pt | null = null

export const acionar = {
  tempestade(p: Pt) {
    if (perf.reducedMotion) return suave(p, 'tempestade')
    comMotor((m) => m.tempestade(p))
  },
  impacto(p: Pt) {
    if (perf.reducedMotion) return suave(p, 'impacto')
    comMotor((m) => m.impacto(p))
  },
  carga(p: Pt) {
    pontoCarga = p
    if (perf.reducedMotion) return
    comMotor((m) => m.carga(p))
  },
  cargaMover(p: Pt) {
    pontoCarga = p
    if (motor) motor.cargaMover(p)
  },
  cargaSoltar() {
    if (perf.reducedMotion) {
      if (pontoCarga) suave(pontoCarga, 'rajada')
      pontoCarga = null
      return
    }
    comMotor((m) => m.cargaSoltar())
  },
  cargaCancelar() {
    pontoCarga = null
    if (!perf.reducedMotion) comMotor((m) => m.cargaCancelar())
  },
  magia(p: Pt) {
    if (perf.reducedMotion) {
      if (!magiaSuave) suave(p, 'magia')
      magiaSuave = true
      return
    }
    if (motor) motor.magia(p)
    else comMotor((m) => m.magia(p))
  },
  magiaFim() {
    magiaSuave = false
    if (!perf.reducedMotion) comMotor((m) => m.magiaFim())
  },
  portal(c: Pt, r: number) {
    if (perf.reducedMotion) return suave(c, 'portal')
    comMotor((m) => m.portal(c, r))
  },
  cosmico(c: Pt) {
    pontoCosmico = c
    if (perf.reducedMotion) return
    comMotor((m) => m.cosmico(c))
  },
  cosmicoMover(c: Pt) {
    pontoCosmico = c
    if (motor) motor.cosmicoMover(c)
  },
  cosmicoSoltar() {
    if (perf.reducedMotion) {
      if (pontoCosmico) suave(pontoCosmico, 'cosmico')
      pontoCosmico = null
      return
    }
    comMotor((m) => m.cosmicoSoltar())
  },

  /** Portal da confirmação (de onde sai a credencial): não conta no medidor. */
  portalCredencial(c: Pt, r: number) {
    if (perf.reducedMotion) return brilhoSuave(c, 'portal')
    comMotor((m) => m.portal(c, r, false))
  },

  /** Explosão de energia cósmica decorativa (contagem no dia da festa): não conta no medidor. */
  async festa(c: Pt) {
    if (perf.reducedMotion) return brilhoSuave(c, 'cosmico')
    const m = await carregarMotor()
    if (!m || m.ocupado()) return
    m.cosmico(c)
    setTimeout(() => m.cosmicoSoltar(false), 1300)
  },

  /** Botão "Disparar" da seção PODERES. */
  async demo(id: PoderId) {
    if (perf.reducedMotion) return suave(centro(), id)
    const m = await carregarMotor()
    if (m) await m.demo(id)
    else suave(centro(), id)
  },

  /** SOBRECARGA: todos os poderes juntos por ~3 s. Resolve quando é hora da mensagem final. */
  async sobrecarga() {
    const W = innerWidth
    const H = innerHeight
    const espera = (ms: number) => new Promise((r) => setTimeout(r, ms))
    if (perf.reducedMotion) {
      for (const [i, p] of PODERES.entries()) setTimeout(() => brilhoSuave({ x: W * (0.2 + 0.6 * ((i % 3) / 2)), y: H * (0.35 + 0.2 * Math.floor(i / 3)) }, p.id), i * 380)
      return espera(2600)
    }
    const m = await carregarMotor()
    if (!m) return espera(400)
    m.tempestade({ x: W * 0.3, y: H * 0.58 })
    setTimeout(() => m.portal({ x: W / 2, y: H * 0.4 }, Math.min(W, H) * 0.28), 350)
    setTimeout(() => m.impacto({ x: W * 0.72, y: H * 0.66 }), 700)
    setTimeout(() => void m.demo('magia', { x: W / 2, y: H * 0.42 }), 900)
    setTimeout(() => m.carga({ x: W * 0.5, y: H * 0.78 }), 1000)
    setTimeout(() => m.cargaSoltar(), 1800)
    setTimeout(() => m.cosmico({ x: W / 2, y: H * 0.42 }), 1500)
    setTimeout(() => m.cosmicoSoltar(), 2900)
    return espera(3200)
  },
}
