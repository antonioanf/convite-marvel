import { useEffect, useRef, useState, type ReactNode } from 'react'
import { convite } from '../../config/convite'
import { perf } from '../../lib/perf'
import { vibrate } from '../../lib/haptics'
import { celebrate } from '../../lib/celebrate'
import { field } from '../../lib/butterflyField'
import { sfx } from '../../lib/sfx'

const GOAL = 0.6 // ao raspar 60%, completa sozinha

/**
 * Raspadinha: uma camada prateada holográfica (como o balão) cobre o conteúdo.
 * O conteúdo fica SEMPRE no HTML (leitores de tela leem normalmente); o canvas é só visual.
 * Com prefers-reduced-motion já começa revelado. Teclado: botão "Revelar" aparece ao focar.
 */
export function Scratch({ children, hint = 'Raspe aqui ✨' }: { children: ReactNode; hint?: string }) {
  const [revealed, setRevealed] = useState(perf.reducedMotion)
  const [gone, setGone] = useState(perf.reducedMotion)
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const state = useRef({ drawing: false, lx: 0, ly: 0, lastCheck: 0, scratched: false })

  // pinta a camada prateada
  useEffect(() => {
    if (revealed) return
    const c = canvas.current
    if (!c) return
    const paint = () => {
      const r = c.getBoundingClientRect()
      const dpr = Math.min(1.5, window.devicePixelRatio || 1)
      c.width = Math.round(r.width * dpr)
      c.height = Math.round(r.height * dpr)
      const g = c.getContext('2d')!
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      const p = convite.paleta
      const lg = g.createLinearGradient(0, 0, r.width, r.height)
      lg.addColorStop(0, p.prata)
      lg.addColorStop(0.25, p.holoCiano)
      lg.addColorStop(0.45, '#ffffff')
      lg.addColorStop(0.62, p.holoRosa)
      lg.addColorStop(0.8, p.lavanda)
      lg.addColorStop(1, p.prata)
      g.fillStyle = lg
      g.beginPath()
      g.roundRect(0, 0, r.width, r.height, 18)
      g.fill()
      // brilho metálico em faixas
      g.globalAlpha = 0.35
      for (let x = -r.height; x < r.width; x += 22) {
        g.fillStyle = '#ffffff'
        g.beginPath()
        g.moveTo(x, r.height)
        g.lineTo(x + 8, r.height)
        g.lineTo(x + 8 + r.height, 0)
        g.lineTo(x + r.height, 0)
        g.fill()
      }
      // purpurina
      g.globalAlpha = 0.9
      for (let i = 0; i < (r.width * r.height) / 140; i++) {
        g.fillStyle = Math.random() < 0.5 ? '#ffffff' : p.lilas
        g.fillRect(Math.random() * r.width, Math.random() * r.height, 1.4, 1.4)
      }
      g.globalAlpha = 1
      g.fillStyle = p.roxo
      g.font = `600 14px ${getComputedStyle(document.documentElement).getPropertyValue('--font-mono') || 'monospace'}`
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillText(hint.toUpperCase(), r.width / 2, r.height / 2)
    }
    paint()
    document.fonts?.ready.then(() => !state.current.scratched && paint())
  }, [revealed, hint])

  const reveal = (auto: boolean) => {
    if (revealed) return
    setRevealed(true)
    vibrate([12, 40, 20])
    sfx.sparkle()
    const r = box.current?.getBoundingClientRect()
    if (r) {
      for (let i = 0; i < 5; i++) field.emitSparkles(r.left + (r.width * (i + 0.5)) / 5, r.top + r.height / 2, 8, 160)
      if (auto) celebrate({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, 'leve')
    }
    setTimeout(() => setGone(true), 700)
  }

  const coverage = () => {
    const c = canvas.current
    if (!c) return 0
    const g = c.getContext('2d')!
    const { data } = g.getImageData(0, 0, c.width, c.height)
    let clear = 0
    let total = 0
    for (let i = 3; i < data.length; i += 4 * 16) {
      total++
      if (data[i] < 40) clear++
    }
    return total ? clear / total : 0
  }

  const scratch = (x: number, y: number, first: boolean) => {
    const c = canvas.current
    if (!c) return
    const r = c.getBoundingClientRect()
    const g = c.getContext('2d')!
    const px = x - r.left
    const py = y - r.top
    g.globalCompositeOperation = 'destination-out'
    g.lineCap = 'round'
    g.lineJoin = 'round'
    g.lineWidth = 38
    g.beginPath()
    const st = state.current
    g.moveTo(first ? px : st.lx, first ? py : st.ly)
    g.lineTo(px + 0.1, py)
    g.stroke()
    g.globalCompositeOperation = 'source-over'
    st.lx = px
    st.ly = py
    st.scratched = true
    const now = performance.now()
    if (now - st.lastCheck > 120) {
      st.lastCheck = now
      if (coverage() >= GOAL) reveal(true)
    }
  }

  return (
    <div ref={box} className="scratch relative" data-revealed={revealed ? 'true' : 'false'}>
      {children}
      {!gone && (
        <canvas
          ref={canvas}
          aria-hidden="true"
          data-no-spawn
          className={`absolute -inset-2 h-[calc(100%+16px)] w-[calc(100%+16px)] cursor-grab touch-none rounded-[18px] transition-opacity duration-700 ${revealed ? 'opacity-0' : ''}`}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            state.current.drawing = true
            scratch(e.clientX, e.clientY, true)
          }}
          onPointerMove={(e) => state.current.drawing && scratch(e.clientX, e.clientY, false)}
          onPointerUp={() => {
            state.current.drawing = false
            if (coverage() >= GOAL) reveal(true)
          }}
          onPointerCancel={() => (state.current.drawing = false)}
        />
      )}
      {!revealed && (
        <button type="button" onClick={() => reveal(false)} className="sr-only focus:not-sr-only focus:absolute focus:inset-0 focus:z-10 focus:rounded-[18px] focus:bg-white focus:font-semibold focus:text-roxo">
          Revelar a data
        </button>
      )}
    </div>
  )
}
