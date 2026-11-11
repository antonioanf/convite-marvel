/**
 * Inclinação do celular (DeviceOrientation) → valores suaves entre -1 e 1.
 * No iOS 13+ a permissão precisa ser pedida dentro de um toque (fazemos isso na intro).
 * Sem permissão/sem sensor: fica em 0 e nada quebra.
 */
export const tilt = { x: 0, y: 0, tx: 0, ty: 0, active: false }

let baseBeta: number | null = null
let listening = false

function onOrient(e: DeviceOrientationEvent) {
  if (e.gamma == null || e.beta == null) return
  if (baseBeta == null) baseBeta = e.beta
  // gamma: esquerda/direita (-90..90); beta: frente/trás relativo à posição inicial
  tilt.tx = Math.max(-1, Math.min(1, e.gamma / 25))
  tilt.ty = Math.max(-1, Math.min(1, (e.beta - baseBeta) / 25))
  tilt.active = true
}

function listen() {
  if (listening) return
  listening = true
  window.addEventListener('deviceorientation', onOrient, { passive: true })
}

type IOSOrientation = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> }

/** Chamar DENTRO de um gesto do usuário (toque). */
export function requestTilt() {
  try {
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) return
    const DOE = DeviceOrientationEvent as IOSOrientation
    if (typeof DOE.requestPermission === 'function') {
      DOE.requestPermission()
        .then((r) => r === 'granted' && listen())
        .catch(() => {})
    } else {
      listen()
    }
  } catch {
    /* ignorado */
  }
}

/** Suaviza (chamar a cada frame). */
export function updateTilt(dt: number) {
  const k = 1 - Math.exp(-dt * 4)
  tilt.x += (tilt.tx - tilt.x) * k
  tilt.y += (tilt.ty - tilt.y) * k
}
