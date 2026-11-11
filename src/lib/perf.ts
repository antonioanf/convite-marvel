/**
 * "Modo leve": menos partículas e canvas em resolução menor (DPR 1).
 * Leve quando: hardwareConcurrency ≤ 4, deviceMemory ≤ 4, economia de dados,
 * ou quando o FPS dos efeitos fica baixo (perf.downgrade).
 */
import { debug } from './debug'

type Nav = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
type Listener = () => void

export function prefersReducedMotion() {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

function initialLite(): boolean {
  if (debug.modo === 'leve') return true
  if (debug.modo === 'normal') return false
  if (typeof navigator === 'undefined') return false
  const n = navigator as Nav
  if (n.hardwareConcurrency && n.hardwareConcurrency <= 4) return true
  if (n.deviceMemory && n.deviceMemory <= 4) return true
  if (n.connection?.saveData) return true
  return false
}

let lite = initialLite()
const listeners = new Set<Listener>()

let webgl: boolean | null = null

export const perf = {
  reducedMotion: prefersReducedMotion(),
  isLite: () => lite,
  /** O aparelho tem WebGL? (testado uma vez, com um canvas descartável) */
  temWebgl() {
    if (webgl !== null) return webgl
    try {
      const c = document.createElement('canvas')
      const gl = c.getContext('webgl', { failIfMajorPerformanceCaveat: true })
      webgl = !!gl
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
    } catch {
      webgl = false
    }
    return webgl
  },
  /** Máximo de partículas ao mesmo tempo. */
  maxParticles: () => (lite ? 60 : 150),
  /** Chamado pelos efeitos se o FPS ficar baixo. */
  downgrade(reason: string) {
    if (lite || debug.modo === 'normal') return
    lite = true
    console.info(`[convite] modo leve ativado: ${reason}`)
    listeners.forEach((l) => l())
  },
  subscribe(l: Listener) {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
}
