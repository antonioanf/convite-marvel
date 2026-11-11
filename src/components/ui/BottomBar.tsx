import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { convite } from '../../config/convite'
import { useOpened } from '../../hooks/useStores'
import { scroll } from '../../lib/scroll'
import { SomButton } from './SomButton'
import { PressButton } from './Press'

/**
 * Barra embaixo (alcance do polegar): botão de som (sempre visível) + "ACEITAR MISSÃO",
 * que aparece depois do hero e some quando a seção de confirmação está na tela.
 */
export function BottomBar() {
  const opened = useOpened()
  const [showCta, setShowCta] = useState(false)

  useEffect(() => {
    if (!opened || !convite.secoes.rsvp) return
    const hero = document.getElementById('inicio')
    const rsvp = document.getElementById('confirmar')
    let pastHero = false
    let rsvpVisible = false
    const update = () => setShowCta(pastHero && !rsvpVisible)
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.target === hero) pastHero = !e.isIntersecting
        if (e.target === rsvp) rsvpVisible = e.isIntersecting
      })
      update()
    })
    if (hero) io.observe(hero)
    if (rsvp) io.observe(rsvp)
    return () => io.disconnect()
  }, [opened])

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={opened ? { opacity: 1, y: 0 } : undefined}
      transition={{ delay: 1.8, duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex items-end justify-end gap-2.5 px-[max(16px,env(safe-area-inset-left))] pb-[max(16px,env(safe-area-inset-bottom))]"
    >
      <AnimatePresence initial={false}>
        {showCta && (
          <motion.div
            key="cta"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            className="pointer-events-auto"
          >
            <PressButton className="min-h-[52px] whitespace-nowrap" onClick={() => scroll.to('#confirmar')}>
              Aceitar missão
            </PressButton>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="pointer-events-auto">
        <SomButton />
      </div>
    </motion.div>
  )
}
