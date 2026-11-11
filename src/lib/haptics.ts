/** Vibração curta — silenciosamente ignorada onde não existe (iOS, WhatsApp interno etc.). */
export function vibrate(pattern: number | number[] = 12) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(pattern)
  } catch {
    /* sem suporte */
  }
}
