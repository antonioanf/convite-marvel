import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { convite } from '../../config/convite'
import { Cake } from '../ui/Cake'
import { Icon } from '../ui/Icons'
import { vibrate } from '../../lib/haptics'
import { celebrate } from '../../lib/celebrate'
import { sfx } from '../../lib/sfx'

const HOLD_MS = 1300 // quanto tempo segurando para apagar

type Mic = 'off' | 'listening' | 'denied'

/**
 * Bolinho com as velas acesas. Apaga SEGURANDO o dedo (ou Espaço/Enter no teclado)
 * ou, se a pessoa permitir, soprando no microfone. Ao apagar: fumacinha, confete e um pedido.
 */
export function Candles() {
  const c = convite.crianca
  const first = c.nome.split(' ')[0]
  const [lit, setLit] = useState(true)
  const [progress, setProgress] = useState(0)
  const [mic, setMic] = useState<Mic>('off')
  const btn = useRef<HTMLButtonElement>(null)
  const hold = useRef({ on: false, raf: 0, last: 0 })
  const stream = useRef<{ stop: () => void } | null>(null)

  const blowOut = () => {
    if (!lit) return
    setLit(false)
    setProgress(0)
    stopMic()
    vibrate([30, 60, 30, 60, 90])
    sfx.chime()
    celebrate(btn.current, 'grande')
  }

  // segurar: o progresso sobe enquanto o dedo está em cima e desce devagar quando solta
  const prog = useRef(0)
  const blowRef = useRef(blowOut)
  blowRef.current = blowOut
  const tick = (now: number) => {
    const h = hold.current
    const dt = h.last ? now - h.last : 16
    h.last = now
    const p = Math.max(0, Math.min(1, prog.current + (h.on ? dt / HOLD_MS : -dt / 600)))
    prog.current = p
    setProgress(p)
    if (h.on && p >= 1) {
      h.on = false
      h.raf = 0
      h.last = 0
      prog.current = 0
      blowRef.current()
      return
    }
    if (!h.on && p <= 0) {
      h.raf = 0
      h.last = 0
      return
    }
    h.raf = requestAnimationFrame(tick)
  }
  const start = () => {
    if (!lit) return
    hold.current.on = true
    vibrate(8)
    if (!hold.current.raf) hold.current.raf = requestAnimationFrame(tick)
  }
  const stop = () => {
    hold.current.on = false
  }

  // microfone: mede o volume e apaga com um sopro (~0,25 s acima do limite)
  const stopMic = () => {
    stream.current?.stop()
    stream.current = null
    setMic((m) => (m === 'listening' ? 'off' : m))
  }
  const useMic = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false } })
      const AC = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      const ctx = new AC()
      const an = ctx.createAnalyser()
      an.fftSize = 512
      ctx.createMediaStreamSource(s).connect(an)
      const buf = new Uint8Array(an.fftSize)
      let loud = 0
      let raf = 0
      let lastT = performance.now()
      const loop = () => {
        an.getByteTimeDomainData(buf)
        let sum = 0
        for (const v of buf) sum += ((v - 128) / 128) ** 2
        const rms = Math.sqrt(sum / buf.length)
        const now = performance.now()
        loud = rms > 0.14 ? loud + (now - lastT) : Math.max(0, loud - (now - lastT) * 0.5)
        lastT = now
        setProgress(Math.min(1, loud / 250))
        if (loud >= 250) {
          blowOut()
          return
        }
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
      stream.current = {
        stop: () => {
          cancelAnimationFrame(raf)
          s.getTracks().forEach((t) => t.stop())
          ctx.close().catch(() => {})
        },
      }
      setMic('listening')
    } catch {
      setMic('denied')
    }
  }

  useEffect(() => () => {
    cancelAnimationFrame(hold.current.raf)
    stream.current?.stop()
  }, [])

  const relight = () => {
    setLit(true)
    vibrate(10)
  }

  return (
    <div className="flex h-full flex-col items-center justify-between gap-2 text-center" data-velas={lit ? 'acesas' : 'apagadas'}>
      <span className="label text-[10px] tracking-[0.16em]">
        {c.idade} {c.idade === 1 ? 'velinha' : 'velinhas'}
      </span>
      <button
        ref={btn}
        type="button"
        data-no-spawn
        aria-label={lit ? 'Segure para apagar as velinhas' : 'Velinhas apagadas'}
        disabled={!lit}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          start()
        }}
        onPointerUp={stop}
        onPointerCancel={stop}
        onLostPointerCapture={stop}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
            e.preventDefault()
            start()
          }
        }}
        onKeyUp={(e) => (e.key === ' ' || e.key === 'Enter') && stop()}
        className="candles-hit relative w-full flex-1 touch-none select-none"
      >
        <Cake candles={c.idade} lit={lit} progress={progress} />
      </button>
      {/* barra de progresso do "sopro" */}
      <div className="h-1.5 w-4/5 overflow-hidden rounded-full bg-lavanda" aria-hidden="true">
        <div className="h-full origin-left rounded-full bg-gradient-to-r from-violeta to-magenta" style={{ transform: `scaleX(${lit ? progress : 1})` }} />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {lit ? (
          <motion.div key="acesas" exit={{ opacity: 0 }} className="flex flex-col items-center gap-1">
            <p className="text-[13px] font-semibold leading-snug text-tinta-2">
              {mic === 'listening' ? 'Sopre no microfone! 🌬️' : 'Segure o dedo nas velas'}
            </p>
            {mic !== 'listening' && typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && (
              <button type="button" onClick={useMic} className="flex min-h-11 items-center gap-1 px-2 text-[12px] font-bold text-violeta-txt underline underline-offset-4">
                <Icon name="microfone" size={15} />
                {mic === 'denied' ? 'Sem microfone: segure 💜' : 'usar microfone'}
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="apagadas"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-1"
            role="status"
          >
            <p className="text-[13px] font-bold leading-snug text-roxo">Faça um pedido junto com a {first}! ✨</p>
            <button type="button" onClick={relight} className="min-h-11 px-2 text-[12px] font-bold text-violeta-txt underline underline-offset-4">
              Acender de novo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
