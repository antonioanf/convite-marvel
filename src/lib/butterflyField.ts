/**
 * Simulação das borboletas em coordenadas de tela (px).
 * Não depende de React nem de three.js: o renderizador 3D (R3F) e o 2D (canvas)
 * apenas leem `field.butterflies` a cada frame.
 *
 * Comportamentos:
 *  - voo curvo e orgânico (ruído suave no rumo + desvio das bordas)
 *  - fogem do dedo quando ele chega perto
 *  - algumas pousam em elementos com `data-perch="fx,fy,ângulo;..."`
 *  - um toque numa área vazia solta 2–3 borboletas; arrastar deixa um rastro de brilhos
 *  - tocar numa borboleta "pega" ela (vira brilho e soma no contador); outra entra voando depois
 */
import { scrollPos } from './scrollPos'
import { vibrate } from './haptics'
import { sfx } from './sfx'

export type BState = 'fly' | 'approach' | 'perched' | 'leave'

export interface PerchSlot {
  el: Element
  fx: number
  fy: number
  angle: number
  occupant: Butterfly | null
}

export interface Butterfly {
  id: number
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  heading: number
  /** envergadura em px (em z = 0) */
  size: number
  variant: number
  phase: number
  flapRate: number
  flapAmp: number
  /** ângulo atual das asas: 0 = abertas, 1 = fechadas para cima */
  wing: number
  state: BState
  slot: PerchSlot | null
  seed: number
  bornAt: number
  life: number
  restUntil: number
  nextPerchCheck: number
  lander: boolean
  scaredUntil: number
  bank: number
}

export interface Sparkle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  hue: number
}

const TAU = Math.PI * 2
const rand = (a: number, b: number) => a + Math.random() * (b - a)
const noise = (t: number, s: number) =>
  Math.sin(t * 0.9 + s) * 0.6 + Math.sin(t * 2.3 + s * 1.7) * 0.3 + Math.sin(t * 0.37 + s * 3.1) * 0.5

function angleLerp(a: number, b: number, k: number) {
  let d = ((b - a + Math.PI) % TAU) - Math.PI
  if (d < -Math.PI) d += TAU
  return a + d * k
}

let nextId = 1

class ButterflyField {
  butterflies: Butterfly[] = []
  sparkles: Sparkle[] = []
  width = typeof window !== 'undefined' ? window.innerWidth : 390
  height = typeof window !== 'undefined' ? window.innerHeight : 844
  pointer = { x: -999, y: -999, down: false, t: -1e9 }
  time = 0
  running = false
  ambientCount = 8
  maxSpawned = 8
  maxSparkles = 120
  /** borboletas pegas pela pessoa (meta: CATCH_GOAL) */
  caught = 0
  private catchListeners = new Set<(n: number) => void>()
  slow = false
  private slots: PerchSlot[] = []
  private nextPerchScan = 0

  configure(opts: { ambient: number; slow?: boolean; lite?: boolean }) {
    this.ambientCount = opts.ambient
    this.maxSparkles = opts.lite ? 60 : 120
    this.slow = !!opts.slow
    // ajusta a população se o modo mudar (ex.: caiu para o modo leve)
    const ambient = this.butterflies.filter((b) => !isFinite(b.life) || b.life > 1e8)
    if (ambient.length > opts.ambient) {
      ambient.slice(opts.ambient).forEach((b) => this.remove(b))
    }
  }

  /** Começa a revoada saindo de um ponto (a posição do casulo). */
  start(fromX = this.width / 2, fromY = this.height * 0.42) {
    if (this.running) return
    this.running = true
    for (let i = 0; i < this.ambientCount; i++) {
      const a = (i / this.ambientCount) * TAU + rand(-0.3, 0.3)
      const sp = rand(140, 260)
      this.add({
        x: fromX,
        y: fromY,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        vz: rand(0.5, 2),
        z: rand(-0.6, 0.8),
        size: rand(40, 54),
        lander: i < 3,
        life: Infinity,
      })
    }
  }

  add(p: Partial<Butterfly> & { x: number; y: number }) {
    const b: Butterfly = {
      id: nextId++,
      z: 0,
      vx: 0,
      vy: -40,
      vz: 0,
      heading: -Math.PI / 2,
      size: 40,
      variant: Math.floor(Math.random() * 3),
      phase: rand(0, TAU),
      flapRate: rand(16, 22),
      flapAmp: 1,
      wing: 0,
      state: 'fly',
      slot: null,
      seed: rand(0, 100),
      bornAt: this.time,
      life: Infinity,
      restUntil: 0,
      nextPerchCheck: this.time + rand(2.5, 6),
      lander: false,
      scaredUntil: 0,
      bank: 0,
      ...p,
    }
    b.heading = Math.atan2(b.vy, b.vx)
    this.butterflies.push(b)
    return b
  }

  remove(b: Butterfly) {
    if (b.slot) b.slot.occupant = null
    const i = this.butterflies.indexOf(b)
    if (i >= 0) this.butterflies.splice(i, 1)
  }

  /** Toque numa área vazia: 2–3 borboletas saem voando dali. */
  spawnAt(x: number, y: number) {
    const n = 2 + (Math.random() < 0.5 ? 1 : 0)
    for (let k = 0; k < n; k++) {
      const spawned = this.butterflies.filter((b) => isFinite(b.life))
      if (spawned.length >= this.maxSpawned) this.remove(spawned[0])
      const a = rand(-Math.PI * 0.9, -Math.PI * 0.1)
      const sp = rand(110, 190)
      this.add({
        x: x + rand(-8, 8),
        y: y + rand(-8, 8),
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        vz: 1.2,
        z: -0.4,
        size: rand(28, 38),
        life: rand(8, 12),
        flapRate: 24,
        scaredUntil: this.time + 0.6,
      })
    }
    this.emitSparkles(x, y, 14, 140)
  }

  /** Tenta pegar a borboleta mais próxima do ponto. Retorna true se pegou. */
  catchAt(x: number, y: number) {
    if (!this.running) return false
    let best: Butterfly | null = null
    let bestD = Infinity
    for (const b of this.butterflies) {
      if (b.life < 3) continue // revoadas rápidas de comemoração não contam
      const d = Math.hypot(b.x - x, b.y - y)
      const r = Math.max(36, b.size * 0.8)
      if (d < r && d < bestD) {
        best = b
        bestD = d
      }
    }
    if (!best) return false
    const wasAmbient = !isFinite(best.life)
    this.remove(best)
    this.emitSparkles(best.x, best.y, 26, 200)
    this.caught++
    this.catchListeners.forEach((l) => l(this.caught))
    vibrate([10, 30, 16])
    sfx.pop()
    // outra borboleta entra voando depois de alguns segundos (dá para chegar a 10 sem esperar muito)
    setTimeout(() => this.enter(wasAmbient), rand(2200, 3800))
    return true
  }

  /** Uma borboleta entra voando por uma borda. */
  private enter(ambient: boolean) {
    if (!this.running) return
    const ambientNow = this.butterflies.filter((b) => !isFinite(b.life)).length
    const keep = ambient || ambientNow < this.ambientCount
    const side = Math.floor(Math.random() * 3) // 0 esquerda, 1 direita, 2 baixo
    const x = side === 0 ? -30 : side === 1 ? this.width + 30 : rand(40, this.width - 40)
    const y = side === 2 ? this.height + 30 : rand(this.height * 0.2, this.height * 0.7)
    const tx = this.width * rand(0.3, 0.7)
    const ty = this.height * rand(0.3, 0.6)
    const a = Math.atan2(ty - y, tx - x)
    this.add({ x, y, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, size: rand(36, 50), life: keep ? Infinity : rand(12, 16), lander: keep && Math.random() < 0.4 })
  }

  onCatch(l: (n: number) => void) {
    this.catchListeners.add(l)
    return () => {
      this.catchListeners.delete(l)
    }
  }

  /** Revoada rápida (ex.: ao confirmar presença). */
  burst(x: number, y: number, n = 6) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU)
      const sp = rand(200, 340)
      this.add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, vz: rand(1, 3), size: rand(26, 40), life: rand(1.6, 2.6), flapRate: 26 })
    }
    this.emitSparkles(x, y, 24, 220)
  }

  emitSparkles(x: number, y: number, n: number, speed = 40, life = 0) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU)
      const s = rand(0.2, 1) * speed
      this.sparkles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 10,
        life: 0,
        max: life || rand(0.5, 1.1),
        size: rand(1.2, 3.2),
        hue: Math.random(),
      })
    }
    // limite de partículas ao mesmo tempo (menos no modo leve)
    if (this.sparkles.length > this.maxSparkles) this.sparkles.splice(0, this.sparkles.length - this.maxSparkles)
  }

  resize(w: number, h: number) {
    this.width = w
    this.height = h
  }

  private scanPerches() {
    const els = document.querySelectorAll('[data-perch]')
    const keep: PerchSlot[] = []
    els.forEach((el) => {
      const spec = el.getAttribute('data-perch') || ''
      spec.split(';').forEach((part) => {
        const [fx, fy, ang] = part.split(',').map(Number)
        if (!isFinite(fx) || !isFinite(fy)) return
        const existing = this.slots.find((s) => s.el === el && s.fx === fx && s.fy === fy)
        keep.push(existing ?? { el, fx, fy, angle: ((ang || 0) * Math.PI) / 180, occupant: null })
      })
    })
    // libera vagas de elementos que saíram da página
    this.slots.forEach((s) => {
      if (!keep.includes(s) && s.occupant) {
        s.occupant.slot = null
        s.occupant.state = 'fly'
      }
    })
    this.slots = keep
  }

  private rects = new Map<Element, { r: DOMRect; y: number; t: number }>()

  /** Posição do ponto de pouso. O retângulo do elemento é medido no máximo a cada 0,25 s
   *  (medir a cada quadro forçava layout); entre medições, só desconta o scroll. */
  private slotPoint(s: PerchSlot) {
    let c = this.rects.get(s.el)
    if (!c || this.time - c.t > 0.25) {
      c = { r: s.el.getBoundingClientRect(), y: scrollPos.y, t: this.time }
      this.rects.set(s.el, c)
    }
    const r = c.r
    const dy = scrollPos.y - c.y
    return { x: r.left + r.width * s.fx, y: r.top - dy + r.height * s.fy, visible: r.width > 0 }
  }

  private slotOnScreen(p: { x: number; y: number; visible: boolean }) {
    return p.visible && p.y > 70 && p.y < this.height - 110 && p.x > 10 && p.x < this.width - 10
  }

  step(dt: number) {
    if (!this.running) {
      this.stepSparkles(dt)
      return
    }
    dt = Math.min(dt, 1 / 20)
    this.time += dt
    const t = this.time
    const W = this.width
    const H = this.height
    const pointerActive = this.pointer.down || t - this.pointer.t < 0.5
    const speedMul = this.slow ? 0.5 : 1

    if (t > this.nextPerchScan) {
      this.scanPerches()
      this.nextPerchScan = t + 1.2
    }

    for (let i = this.butterflies.length - 1; i >= 0; i--) {
      const b = this.butterflies[i]
      const age = t - b.bornAt
      if (b.state !== 'leave' && age > b.life) {
        b.state = 'leave'
        if (b.slot) b.slot.occupant = null
        b.slot = null
      }

      // distância do dedo
      const dxp = b.x - this.pointer.x
      const dyp = b.y - this.pointer.y
      const dp = Math.hypot(dxp, dyp)

      let tvx = 0
      let tvy = 0
      let flapTarget = 1
      let rateTarget = 18

      if (b.state === 'perched' && b.slot) {
        const p = this.slotPoint(b.slot)
        if (!this.slotOnScreen(p) || (pointerActive && dp < 95)) {
          // decola
          b.slot.occupant = null
          b.slot = null
          b.state = 'fly'
          b.restUntil = t + rand(4, 7)
          const a = dp < 95 ? Math.atan2(dyp, dxp) : -Math.PI / 2
          b.vx = Math.cos(a) * 220
          b.vy = Math.sin(a) * 220 - 40
          b.scaredUntil = t + 0.8
        } else {
          b.x = p.x
          b.y = p.y
          b.vx = b.vy = 0
          b.z += (0 - b.z) * Math.min(1, dt * 3)
          b.heading = angleLerp(b.heading, -Math.PI / 2 + b.slot.angle, Math.min(1, dt * 6))
          // batida lenta e preguiçosa, com pausas
          const lazy = 0.5 + 0.5 * Math.sin(t * 0.6 + b.seed)
          b.phase += dt * (2.2 + lazy * 1.8)
          const w = 0.5 + 0.5 * Math.sin(b.phase)
          b.wing = 0.25 + w * 0.6 * lazy
          b.bank *= 0.9
          continue
        }
      }

      if (b.state === 'approach' && b.slot) {
        const p = this.slotPoint(b.slot)
        if (!this.slotOnScreen(p) || (pointerActive && dp < 110)) {
          b.slot.occupant = null
          b.slot = null
          b.state = 'fly'
          b.restUntil = t + 3
        } else {
          const dx = p.x - b.x
          const dy = p.y - b.y
          const d = Math.hypot(dx, dy)
          const sp = Math.min(110, d * 2.2 + 8) * speedMul
          tvx = (dx / (d || 1)) * sp
          tvy = (dy / (d || 1)) * sp
          rateTarget = d < 60 ? 12 : 18
          if (d < 3) {
            b.state = 'perched'
            b.x = p.x
            b.y = p.y
            continue
          }
        }
      }

      if (b.state === 'fly' || b.state === 'leave') {
        // rumo com ruído suave → caminhos curvos
        const n = noise(t * 0.55, b.seed)
        let desired = b.heading + n * 2.4 * dt * 1.6
        const speed = (48 + 26 * Math.sin(t * 0.7 + b.seed)) * speedMul

        if (b.state === 'leave') {
          // sai pela borda mais próxima
          const ex = b.x < W / 2 ? -1 : 1
          desired = angleLerp(desired, Math.atan2(-0.6, ex), dt * 2)
        } else {
          // evita as bordas (margem maior em cima/embaixo por causa da barra inferior)
          const mx = 34
          const myTop = 70
          const myBot = 130
          let ax = 0
          let ay = 0
          if (b.x < mx) ax = 1
          else if (b.x > W - mx) ax = -1
          if (b.y < myTop) ay = 1
          else if (b.y > H - myBot) ay = -1
          if (ax || ay) desired = angleLerp(desired, Math.atan2(ay, ax), dt * 3)
          // prefere voar pelas laterais para não cobrir os textos
          const cx = (b.x - W / 2) / (W / 2)
          if (Math.abs(cx) < 0.62 && !ax && !ay) {
            const side = cx < 0 ? Math.PI : 0
            desired = angleLerp(desired, side, dt * 3.2 * (1 - Math.abs(cx) / 0.62))
          }
        }
        b.heading = desired
        tvx = Math.cos(desired) * speed * (b.state === 'leave' ? 2.2 : 1)
        tvy = Math.sin(desired) * speed * (b.state === 'leave' ? 2.2 : 1)

        // procura um lugar para pousar
        if (b.lander && b.state === 'fly' && t > b.nextPerchCheck && t > b.restUntil) {
          b.nextPerchCheck = t + rand(3, 7)
          const free = this.slots.filter((s) => !s.occupant && this.slotOnScreen(this.slotPoint(s)))
          if (free.length) {
            const s = free[Math.floor(Math.random() * free.length)]
            s.occupant = b
            b.slot = s
            b.state = 'approach'
          }
        }
      }

      // fuga do dedo
      if (pointerActive && dp < 140 && b.state !== 'leave') {
        const f = (1 - dp / 140) ** 2
        tvx += (dxp / (dp || 1)) * 520 * f
        tvy += (dyp / (dp || 1)) * 520 * f
        if (f > 0.15) b.scaredUntil = t + 0.6
      }

      const scared = t < b.scaredUntil
      const k = 1 - Math.exp(-dt * (scared ? 6 : 2.2))
      b.vx += (tvx - b.vx) * k
      b.vy += (tvy - b.vy) * k
      b.x += b.vx * dt
      b.y += b.vy * dt

      // profundidade (z) flutua devagar; revoadas vêm em direção à câmera
      b.vz *= Math.exp(-dt * 1.5)
      b.z += (b.vz + Math.sin(t * 0.3 + b.seed) * 0.15) * dt
      b.z = Math.max(-1.5, Math.min(2.5, b.z))

      // orientação do corpo segue a velocidade; inclinação lateral nas curvas
      const sp = Math.hypot(b.vx, b.vy)
      if (sp > 4) {
        const h = Math.atan2(b.vy, b.vx)
        const prev = b.heading
        b.heading = angleLerp(b.heading, h, Math.min(1, dt * 5))
        b.bank += ((b.heading - prev) / Math.max(dt, 1e-3) * 0.12 - b.bank) * Math.min(1, dt * 4)
      }

      // asas
      flapTarget = scared ? 1 : flapTarget
      rateTarget = scared ? 30 : b.state === 'leave' ? 26 : rateTarget
      b.flapRate += (rateTarget * (this.slow ? 0.6 : 1) - b.flapRate) * Math.min(1, dt * 3)
      b.phase += dt * b.flapRate
      // planar de vez em quando: asas abertas por um instante
      const glide = Math.max(0, Math.sin(t * 0.8 + b.seed * 2)) > 0.93 && !scared ? 0.3 : 1
      b.flapAmp += (flapTarget * glide - b.flapAmp) * Math.min(1, dt * 4)
      b.wing = (0.5 + 0.5 * Math.sin(b.phase)) * 0.92 * b.flapAmp

      // remove as que saíram da tela
      if (b.state === 'leave' && (b.x < -80 || b.x > W + 80 || b.y < -80 || b.y > H + 80)) {
        this.remove(b)
      }
    }

    this.stepSparkles(dt)
  }

  private stepSparkles(dt: number) {
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i]
      s.life += dt
      if (s.life > s.max) {
        this.sparkles.splice(i, 1)
        continue
      }
      s.vx *= Math.exp(-dt * 2)
      s.vy = s.vy * Math.exp(-dt * 2) + 20 * dt
      s.x += s.vx * dt
      s.y += s.vy * dt
    }
  }
}

export const field = new ButterflyField()

/* ---------------- entrada de toque ---------------- */

let attached = false

export function attachFieldInput() {
  if (attached || typeof window === 'undefined') return
  attached = true
  let downX = 0
  let downY = 0
  let downT = 0
  let lastEmit = 0
  let moved = 0
  let downTarget: EventTarget | null = null
  let downCaught = false

  const isTyping = (el: EventTarget | null) => el instanceof Element && !!el.closest('input, textarea, select, [role="dialog"]')
  const isInteractive = (el: EventTarget | null) =>
    el instanceof Element &&
    !!el.closest('button, a, input, textarea, select, label, [role="button"], [data-no-spawn], [role="dialog"]')

  const down = (x: number, y: number, target: EventTarget | null) => {
    field.pointer.x = x
    field.pointer.y = y
    field.pointer.down = true
    field.pointer.t = field.time
    downX = x
    downY = y
    downT = performance.now()
    moved = 0
    downTarget = target
    // pegar no instante do toque (antes de a borboleta fugir do dedo)
    downCaught = !isTyping(target) && field.catchAt(x, y)
  }
  const move = (x: number, y: number) => {
    moved += Math.hypot(x - field.pointer.x, y - field.pointer.y)
    field.pointer.x = x
    field.pointer.y = y
    field.pointer.t = field.time
    const now = performance.now()
    if (now - lastEmit > 16) {
      lastEmit = now
      field.emitSparkles(x, y, 2, 30, 0.6)
    }
  }
  const up = (x: number, y: number, cancelled: boolean) => {
    field.pointer.down = false
    field.pointer.t = field.time
    const quick = performance.now() - downT < 350
    const still = Math.hypot(x - downX, y - downY) < 10 && moved < 14
    if (!cancelled && quick && still && !downCaught && field.running && !isInteractive(downTarget)) {
      field.spawnAt(x, y)
      vibrate(12)
    }
  }

  // Toque: eventos touch continuam chegando durante a rolagem (pointer seria cancelado).
  const opts = { passive: true } as const
  window.addEventListener('touchstart', (e) => { const t = e.touches[0]; if (t) down(t.clientX, t.clientY, e.target) }, opts)
  window.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) move(t.clientX, t.clientY) }, opts)
  window.addEventListener('touchend', (e) => { const t = e.changedTouches[0]; if (t) up(t.clientX, t.clientY, false) }, opts)
  window.addEventListener('touchcancel', () => up(field.pointer.x, field.pointer.y, true), opts)

  // Mouse (desktop dentro da moldura): só conta enquanto pressionado.
  window.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') down(e.clientX, e.clientY, e.target) }, opts)
  window.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && field.pointer.down) move(e.clientX, e.clientY) }, opts)
  window.addEventListener('pointerup', (e) => { if (e.pointerType === 'mouse') up(e.clientX, e.clientY, false) }, opts)

  window.addEventListener('resize', () => field.resize(window.innerWidth, window.innerHeight), opts)
}
