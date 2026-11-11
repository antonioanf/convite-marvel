import { pintarCeu } from './ceu'

/** Pinta o céu fora da thread principal e devolve os pixels (transferidos, sem cópia). */
self.onmessage = (e: MessageEvent<{ w: number; h: number; seed: number }>) => {
  const { w, h, seed } = e.data
  const px = pintarCeu(w, h, seed)
  ;(self as unknown as Worker).postMessage(px, [px.buffer])
}
