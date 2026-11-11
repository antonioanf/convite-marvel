import { useEffect, useRef } from 'react'
import { field, type Butterfly } from '../../lib/butterflyField'
import { WING, WINGSPAN_UNITS, wingCanvas } from '../../lib/wingArt'
import { tilt, updateTilt } from '../../lib/tilt'
import { updateHolo } from '../../lib/holo'
import { perf } from '../../lib/perf'
import { convite } from '../../config/convite'

/** Estado compartilhado: quando a cena 3D está desenhando, o 2D não desenha borboletas. */
export const renderState = { threeReady: false }

/** Brilho em forma de estrelinha de 4 pontas, com halo colorido (fica visível no fundo claro). */
function starSprite(color: string) {
  const c = document.createElement('canvas')
  c.width = c.height = 48
  const g = c.getContext('2d')!
  const rg = g.createRadialGradient(24, 24, 0, 24, 24, 24)
  rg.addColorStop(0, color)
  rg.addColorStop(0.35, color + '66')
  rg.addColorStop(1, color + '00')
  g.fillStyle = rg
  g.fillRect(0, 0, 48, 48)
  g.translate(24, 24)
  g.fillStyle = '#ffffff'
  g.beginPath()
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? 15 : 3
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2
    g.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  g.closePath()
  g.fill()
  return c
}

function drawButterfly(ctx: CanvasRenderingContext2D, b: Butterfly, ox: number, oy: number, body: string) {
  const img = wingCanvas(b.variant)
  const depth = 1 + b.z * 0.18
  const s = (b.size * depth) / WINGSPAN_UNITS
  const x = b.x + ox * (0.6 + b.z * 0.4)
  const y = b.y + oy * (0.6 + b.z * 0.4)
  // abertura das asas: cos do ângulo simula a rotação no eixo do corpo
  const f = Math.max(0.1, Math.cos(b.wing * Math.PI * 0.47))
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(b.heading + Math.PI / 2)
  ctx.scale(s, s)
  const w = WING.W / WING.S
  const h = WING.H / WING.S
  const ox0 = -WING.OX / WING.S
  const oy0 = -WING.OY / WING.S
  ctx.save()
  ctx.scale(f, 1)
  ctx.drawImage(img, ox0, oy0, w, h)
  ctx.restore()
  ctx.save()
  ctx.scale(-f, 1)
  ctx.drawImage(img, ox0, oy0, w, h)
  ctx.restore()
  ctx.fillStyle = body
  ctx.beginPath()
  ctx.ellipse(0, 2, 2.6, 15, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/**
 * Canvas 2D fixo por cima do conteúdo:
 *  - brilhos (rastro do dedo, revoadas, capturas)
 *  - borboletas no modo leve (ou enquanto a cena 3D carrega)
 * Também é o "relógio" da simulação das borboletas, da inclinação e do brilho holográfico.
 */
export function EffectsLayer() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    const p = convite.paleta
    const sprites = [p.violeta, p.magenta, '#4fb3d1', p.lilas, p.holoRosa].map(starSprite)
    let dpr = 1
    let W = 0
    let H = 0
    const mesh = document.querySelector<HTMLElement>('.mesh')

    const resize = () => {
      dpr = Math.min(perf.isLite() ? 1 : 1.5, window.devicePixelRatio || 1)
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      field.resize(W, H)
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })
    const offLite = perf.subscribe(resize)

    let last = performance.now()
    let raf = 0
    let drewSomething = true
    let lastMesh = ''
    const frame = (nowMs: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (nowMs - last) / 1000)
      last = nowMs
      updateTilt(dt)
      field.step(dt) // lê posições (pouso) antes de qualquer escrita no DOM deste quadro
      updateHolo()

      // parallax do fundo pela inclinação do aparelho (só escreve quando muda)
      const ox = tilt.x * 14
      const oy = tilt.y * 14
      const mt = `translate3d(${(-ox * 1.4).toFixed(1)}px, ${(-oy * 1.4).toFixed(1)}px, 0)`
      if (mesh && mt !== lastMesh) {
        lastMesh = mt
        mesh.style.transform = mt
      }

      const draw2D = !renderState.threeReady && field.butterflies.length > 0
      if (!draw2D && !field.sparkles.length) {
        // nada para desenhar: limpa uma vez e descansa
        if (drewSomething) {
          ctx.setTransform(1, 0, 0, 1, 0, 0)
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          drewSomething = false
        }
        return
      }
      drewSomething = true
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)

      // borboletas 2D
      if (draw2D) {
        for (const b of field.butterflies) drawButterfly(ctx, b, ox, oy, p.roxo)
      }

      // brilhos
      for (const s of field.sparkles) {
        const k = 1 - s.life / s.max
        ctx.globalAlpha = Math.min(1, k * 1.4)
        const r = s.size * (2.2 + 2.2 * k)
        ctx.drawImage(sprites[Math.floor(s.hue * sprites.length) % sprites.length], s.x - r, s.y - r, r * 2, r * 2)
      }
      ctx.globalAlpha = 1
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      offLite()
    }
  }, [])

  return <canvas ref={ref} className="fx-layer" aria-hidden="true" />
}
