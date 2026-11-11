import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { convite } from '../../config/convite'
import { field } from '../../lib/butterflyField'
import { useOpened } from '../../hooks/useStores'
import { ButterflyIcon } from '../ui/ButterflyIcon'
import { PressButton } from '../ui/Press'
import { celebrate } from '../../lib/celebrate'
import { sfx } from '../../lib/sfx'
import { vibrate } from '../../lib/haptics'

export const CATCH_GOAL = 10

/**
 * "Pegue as borboletas": contador discreto no topo (🦋 3/10).
 * Fica no canto inferior esquerdo, acima da pill, e só aparece quando é útil (para não cobrir textos):
 * alguns segundos depois da abertura (com a dica), a cada captura e, ao completar, fica de vez.
 * Ao chegar a 10: mensagem surpresa da aniversariante.
 */
export function CatchCounter() {
  const opened = useOpened()
  const [n, setN] = useState(field.caught)
  const [peek, setPeek] = useState(false)
  const peekTimer = useRef(0)
  const show = (ms: number) => {
    setPeek(true)
    clearTimeout(peekTimer.current)
    peekTimer.current = window.setTimeout(() => setPeek(false), ms)
  }
  const [hint, setHint] = useState(false)
  const [surprise, setSurprise] = useState(false)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const first = convite.crianca.nome.split(' ')[0]

  useEffect(
    () =>
      field.onCatch((c) => {
        setN(c)
        show(3500)
        if (c === CATCH_GOAL) {
          setTimeout(() => {
            setSurprise(true)
            sfx.chime()
            vibrate([20, 50, 20, 50, 80])
            celebrate(null, 'grande')
          }, 350)
        }
      }),
    [],
  )

  useEffect(() => {
    if (!opened) return
    const t = setTimeout(() => show(6500), 2500)
    return () => clearTimeout(t)
  }, [opened])

  // dica que aparece uma vez quando o contador surge
  const visible = opened && (peek || n >= CATCH_GOAL)
  useEffect(() => {
    if (!visible || n > 0) return
    setHint(true)
    const t = setTimeout(() => setHint(false), 5000)
    return () => clearTimeout(t)
  }, [visible]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (surprise) closeBtn.current?.focus({ preventScroll: true })
  }, [surprise])

  const done = n >= CATCH_GOAL

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="pointer-events-none fixed bottom-[calc(max(16px,env(safe-area-inset-bottom))+70px)] left-[max(14px,env(safe-area-inset-left))] z-50"
          >
            <motion.div
              layout
              key={n}
              initial={n > 0 ? { scale: 1.25 } : false}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              className="catch-pill"
              role="status"
              aria-live="polite"
              aria-label={`Borboletas pegas: ${Math.min(n, CATCH_GOAL)} de ${CATCH_GOAL}`}
            >
              <ButterflyIcon size={18} speed={0.6} />
              <AnimatePresence initial={false}>
                {hint && n === 0 && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap text-[12px] font-bold text-roxo"
                  >
                    Pegue 10 borboletas!
                  </motion.span>
                )}
              </AnimatePresence>
              <span className="mono text-[13px] font-semibold text-roxo">
                {Math.min(n, CATCH_GOAL)}/{CATCH_GOAL}
                {done && ' ✓'}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {createPortal(
        <AnimatePresence>
          {surprise && (
            <motion.div
              className="fixed inset-0 z-[92] grid place-items-center bg-[#2b1254]/40 px-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSurprise(false)}
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="surpresa-titulo"
                initial={{ scale: 0.8, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                onClick={(e) => e.stopPropagation()}
                className="card holo-border w-full max-w-[340px] bg-white p-6 text-center"
              >
                <div className="flex justify-center gap-1" aria-hidden="true">
                  <ButterflyIcon size={30} speed={0.3} />
                  <ButterflyIcon size={40} speed={0.25} className="-mt-2" />
                  <ButterflyIcon size={30} speed={0.35} />
                </div>
                <p className="label mt-3">{CATCH_GOAL} de {CATCH_GOAL} borboletas</p>
                <h2 id="surpresa-titulo" className="serif mt-1 text-[40px] leading-none text-roxo">
                  Você conseguiu!
                </h2>
                <p className="mt-3 text-[16px] font-medium leading-relaxed text-tinta-2">
                  A {first} mandou um beijinho de borboleta pra você 💜 Agora é só vir voar com a gente na festa!
                </p>
                <PressButton ref={closeBtn} className="mt-5 w-full" onClick={() => setSurprise(false)}>
                  Oba!
                </PressButton>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
