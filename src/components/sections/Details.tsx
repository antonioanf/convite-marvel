import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { convite } from '../../config/convite'
import { googleCalendarUrl } from '../../lib/calendar'
import { Card } from '../ui/Card'
import { SectionTitle } from '../ui/SectionTitle'
import { PressButton, PressLink } from '../ui/Press'
import { Icon, IconTile, type IconName } from '../ui/Icons'
import { ano, dataCurta, diaMes, diaSemana, hora } from '../../lib/datas'
import { indice } from '../../lib/secoes'
import { Scratch } from '../fun/Scratch'

const isApple = typeof navigator !== 'undefined' && /iPhone|iPad|Macintosh/.test(navigator.userAgent)

function Tile({ icon, label, children, className = '' }: { icon: IconName; label: string; children: ReactNode; className?: string }) {
  return (
    <Card className={`reveal flex flex-col gap-3 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        <IconTile name={icon} />
      </div>
      {children}
    </Card>
  )
}

export function Details() {
  const [agenda, setAgenda] = useState(false)
  const f = convite.festa
  const gcal = (
    <PressLink key="g" variant="soft" href={googleCalendarUrl(convite)} target="_blank" rel="noopener" className="w-full">
      Google Agenda
    </PressLink>
  )
  const ics = (
    <PressLink key="i" variant="soft" href="/convite.ics" download="aniversario-anna-liz.ics" className="w-full">
      {isApple ? 'Agenda do iPhone' : 'Outras agendas (.ics)'}
    </PressLink>
  )

  return (
    <section id="local" aria-labelledby="t-local" className="wrap pb-14">
      <SectionTitle id="t-local" index={indice('local')} kicker="Quando e onde" title="Anote aí" />
      <div className="grid grid-cols-2 gap-3">
        {/* Data com raspadinha prateada por cima */}
        <Tile icon="calendario" label="Data · raspe ✨" className="col-span-2">
          <Scratch>
            <p className="mono whitespace-nowrap text-[clamp(24px,8.6vw,40px)] font-semibold leading-none tracking-tight text-roxo">{dataCurta}</p>
            <p className="mt-2 text-[16px] font-medium text-tinta-2">
              {diaSemana}, {diaMes} de {ano}
            </p>
          </Scratch>
        </Tile>

        <Tile icon="relogio" label="Horário">
          <p className="mono whitespace-nowrap text-[clamp(20px,6.4vw,28px)] font-semibold leading-none text-violeta-txt">{hora ?? 'A definir'}</p>
          <p className="text-[14px] font-medium leading-snug text-tinta-2">{hora ? 'a partir das' : 'avisaremos em breve'}</p>
        </Tile>

        <Tile icon="sol" label="Dia">
          <p className="serif text-[34px] leading-none text-roxo">{diaSemana}</p>
          <p className="text-[14px] font-medium leading-snug text-tinta-2">{diaMes}</p>
        </Tile>

        <Tile icon="pin" label="Local" className="col-span-2">
          <div>
            <p className="serif text-[34px] leading-[1.05] text-roxo">{f.local}</p>
            <p className="mt-1 text-[16px] font-medium text-tinta-2">{f.endereco || 'Endereço completo em breve'}</p>
          </div>
          <div className="mt-2 flex flex-col gap-2.5">
            {f.linkMapa && (
              <PressLink href={f.linkMapa} target="_blank" rel="noopener" className="w-full">
                <Icon name="seta" size={20} />
                Como chegar
              </PressLink>
            )}
            <PressButton variant="soft" className="w-full" aria-expanded={agenda} onClick={() => setAgenda((v) => !v)}>
              <Icon name="mais" size={20} />
              Adicionar à agenda
            </PressButton>
            <AnimatePresence initial={false}>
              {agenda && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                  className="grid grid-cols-1 gap-2.5 overflow-hidden"
                >
                  {isApple ? [ics, gcal] : [gcal, ics]}
                  {!f.horarioDefinido && (
                    <p className="px-2 text-center text-[13px] font-medium text-tinta-2">Entra como evento de dia inteiro até o horário ser confirmado.</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Tile>
      </div>
    </section>
  )
}
