import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { convite } from '../../config/convite'
import { Card } from '../ui/Card'
import { SectionTitle } from '../ui/SectionTitle'
import { PressButton } from '../ui/Press'
import { Icon } from '../ui/Icons'
import { copyText } from '../../lib/clipboard'
import { vibrate } from '../../lib/haptics'
import { field } from '../../lib/butterflyField'
import { indice } from '../../lib/secoes'
import { perf } from '../../lib/perf'

/** A chave "voa" do cartão até o ícone do botão (só transform/opacity). */
function flyInto(from: HTMLElement, to: HTMLElement) {
  if (perf.reducedMotion) return Promise.resolve()
  const a = from.getBoundingClientRect()
  const b = to.getBoundingClientRect()
  const ghost = from.cloneNode(true) as HTMLElement
  ghost.setAttribute('aria-hidden', 'true')
  ghost.style.cssText = `position:fixed;left:${a.left}px;top:${a.top}px;width:${a.width}px;margin:0;z-index:96;pointer-events:none;transform-origin:center`
  document.body.appendChild(ghost)
  const dx = b.left + b.width / 2 - (a.left + a.width / 2)
  const dy = b.top + b.height / 2 - (a.top + a.height / 2)
  const anim = ghost.animate(
    [
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 30}px) scale(.6)`, opacity: 0.9, offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) scale(.08)`, opacity: 0 },
    ],
    { duration: 620, easing: 'cubic-bezier(.4,0,.2,1)' },
  )
  return anim.finished.then(() => ghost.remove()).catch(() => ghost.remove())
}

export function Pix() {
  const pix = convite.pix!
  const [state, setState] = useState<'idle' | 'copied' | 'manual'>('idle')
  const keyRef = useRef<HTMLParagraphElement>(null)
  const iconRef = useRef<HTMLSpanElement>(null)
  const timer = useRef(0)

  const copy = async () => {
    const ok = await copyText(pix.chave)
    clearTimeout(timer.current)
    if (ok) {
      if (keyRef.current && iconRef.current) await flyInto(keyRef.current, iconRef.current)
      vibrate([12, 30, 12])
      setState('copied')
      const r = iconRef.current?.getBoundingClientRect()
      if (r) field.emitSparkles(r.left + r.width / 2, r.top + r.height / 2, 22, 160)
      timer.current = window.setTimeout(() => setState('idle'), 2400)
    } else {
      // sem área de transferência: seleciona a chave para copiar manualmente
      const sel = window.getSelection()
      if (sel && keyRef.current) {
        const range = document.createRange()
        range.selectNodeContents(keyRef.current)
        sel.removeAllRanges()
        sel.addRange(range)
      }
      setState('manual')
    }
  }

  return (
    <section id="presentes" aria-labelledby="t-pix" className="wrap pb-14">
      <SectionTitle id="t-pix" index={indice('presentes')} kicker="Lista de presentes" title="Um mimo?" />
      <Card holo className="reveal p-5">
        <p className="text-[16px] font-medium leading-relaxed text-tinta-2">{pix.mensagem}</p>
        <div className="mt-4 rounded-[20px] border border-dashed border-violeta/40 bg-white/70 px-4 py-4">
          <p className="label">Chave Pix · {pix.tipo}</p>
          <p ref={keyRef} className="mono mt-1.5 select-all break-all text-[17px] font-semibold text-roxo">
            {pix.chave}
          </p>
          <p className="mt-1 text-[15px] font-medium text-tinta-2">{pix.titular}</p>
        </div>
        <PressButton onClick={copy} className="mt-4 w-full" aria-live="polite">
          <span ref={iconRef} className="grid place-items-center">
            <Icon name={state === 'copied' ? 'check' : 'copiar'} size={20} />
          </span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={state}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {state === 'copied' ? 'Copiado ✓' : state === 'manual' ? 'Chave selecionada — copie 👆' : 'Copiar chave Pix'}
            </motion.span>
          </AnimatePresence>
        </PressButton>
      </Card>
    </section>
  )
}
