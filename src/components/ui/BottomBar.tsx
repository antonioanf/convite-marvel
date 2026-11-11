import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { convite } from '../../config/convite'
import { useMusicAvailable, useOpened } from '../../hooks/useStores'
import { scroll } from '../../lib/scroll'
import { MusicButton } from './MusicButton'
import { PressButton } from './Press'
import { ButterflyIcon } from './ButterflyIcon'

/**
 * Pill flutuante clara embaixo (alcance do polegar): "Confirmar presença" + música.
 * O atalho some no hero e quando a seção de confirmação está na tela.
 */
export function BottomBar() {
  const opened = useOpened()
  const hasMusic = useMusicAvailable()
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

  if (!hasMusic && !convite.secoes.rsvp) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={opened ? { opacity: 1, y: 0 } : undefined}
      transition={{ delay: 1.2, type: 'spring', stiffness: 200, damping: 24 }}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-end px-[max(16px,env(safe-area-inset-left))] pb-[max(16px,env(safe-area-inset-bottom))]"
    >
      <motion.div layout transition={{ type: 'spring', stiffness: 380, damping: 32 }} className={`dock pointer-events-auto transition-opacity ${!showCta && !hasMusic ? "pointer-events-none opacity-0" : ""}`}>
        <AnimatePresence initial={false}>
          {showCta && (
            <motion.div
              key="cta"
              initial={{ opacity: 0, scale: 0.85, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: 'auto' }}
              exit={{ opacity: 0, scale: 0.85, width: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="overflow-hidden"
            >
              <PressButton className="whitespace-nowrap" onClick={() => scroll.to('#confirmar')}>
                <ButterflyIcon size={20} speed={0.35} light />
                Confirmar presença
              </PressButton>
            </motion.div>
          )}
        </AnimatePresence>
        <MusicButton />
      </motion.div>
    </motion.div>
  )
}
