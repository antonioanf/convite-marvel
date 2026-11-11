/**
 * Decide entre borboletas 3D (WebGL) e o "modo leve" 2D (canvas).
 * Leve quando: hardwareConcurrency ≤ 4, deviceMemory ≤ 4, sem WebGL,
 * ou quando o FPS medido nos primeiros 2s da cena 3D fica abaixo de 45.
 */
import { debug } from './debug'
import { prefersReducedMotion } from './butterflySvg'

type Nav = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
type Listener = () => void

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

function initialLite(): boolean {
  if (debug.modo === 'leve') return true
  if (debug.modo === '3d') return false
  const n = navigator as Nav
  if (n.hardwareConcurrency && n.hardwareConcurrency <= 4) return true
  if (n.deviceMemory && n.deviceMemory <= 4) return true
  if (n.connection?.saveData) return true
  if (!hasWebGL()) return true
  return false
}

let lite = initialLite()
const listeners = new Set<Listener>()

export const perf = {
  reducedMotion: prefersReducedMotion(),
  isLite: () => lite,
  /** Chamado pela cena 3D se o FPS ficar baixo. */
  downgrade(reason: string) {
    if (lite || debug.modo === '3d') return
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
