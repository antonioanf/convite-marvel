import { useRef, useState, type MouseEvent } from 'react'
import { convite } from '../../config/convite'
import { Card } from '../ui/Card'
import { SectionTitle } from '../ui/SectionTitle'
import { PressButton } from '../ui/Press'
import { Icon } from '../ui/Icons'
import { copyText } from '../../lib/clipboard'
import { vibrate } from '../../lib/haptics'
import { indice } from '../../lib/secoes'
import { fx2d } from '../../lib/fx/camada2d'

/** Pix para presentes (só aparece com `pix` preenchido no config). */
export function Pix() {
  const pix = convite.pix!
  const [estado, setEstado] = useState<'idle' | 'copiado' | 'manual'>('idle')
  const chave = useRef<HTMLParagraphElement>(null)
  const timer = useRef(0)

  const copiar = async (e: MouseEvent<HTMLButtonElement>) => {
    const ok = await copyText(pix.chave)
    clearTimeout(timer.current)
    if (ok) {
      vibrate([12, 30, 12])
      setEstado('copiado')
      const r = e.currentTarget.getBoundingClientRect()
      fx2d.faiscas(r.left + r.width / 2, r.top, 16, { tipo: 2, forca: 260, vida: 0.7 })
      timer.current = window.setTimeout(() => setEstado('idle'), 2400)
    } else {
      // sem área de transferência: seleciona a chave para copiar manualmente
      const sel = window.getSelection()
      if (sel && chave.current) {
        const range = document.createRange()
        range.selectNodeContents(chave.current)
        sel.removeAllRanges()
        sel.addRange(range)
      }
      setEstado('manual')
    }
  }

  return (
    <section id="presentes" aria-labelledby="t-pix" className="wrap secao acc-dourado">
      <SectionTitle id="t-pix" index={indice('presentes')} kicker="Presentes" title="Reforço para a missão" />
      <Card className="reveal p-5">
        <p className="text-[16px] font-medium leading-relaxed txt-2">{pix.mensagem}</p>
        <div className="mt-4 rounded-md border border-dashed border-[rgb(var(--dourado-rgb)/.5)] bg-[rgb(0_0_0/.25)] px-4 py-4" data-sem-gesto>
          <p className="rotulo text-[11px] acc-txt">Chave Pix · {pix.tipo}</p>
          <p ref={chave} className="mono mt-1.5 select-all break-all text-[17px] text-branco" style={{ userSelect: 'all' }}>
            {pix.chave}
          </p>
          <p className="mt-1 text-[15px] font-medium txt-2">{pix.titular}</p>
        </div>
        <PressButton onClick={copiar} className="mt-4 w-full" aria-live="polite">
          <Icon name={estado === 'copiado' ? 'check' : 'copiar'} size={20} />
          {estado === 'copiado' ? 'Copiado' : estado === 'manual' ? 'Chave selecionada: copie' : 'Copiar chave Pix'}
        </PressButton>
      </Card>
    </section>
  )
}
