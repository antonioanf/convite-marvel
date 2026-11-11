import { useCallback, useState } from 'react'
import { vibrate } from '../lib/haptics'

/** Efeito de pressão (escala + brilho) e vibração leve no toque. Sem depender de hover. */
export function usePress() {
  const [pressed, setPressed] = useState(false)
  const on = useCallback(() => setPressed(true), [])
  const off = useCallback(() => setPressed(false), [])
  return {
    pressed,
    handlers: {
      onPointerDown: on,
      onPointerUp: off,
      onPointerLeave: off,
      onPointerCancel: off,
      onClickCapture: () => vibrate(10),
    },
  }
}
