import { useId, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { convite } from '../../config/convite'
import { Card } from '../ui/Card'
import { SectionTitle } from '../ui/SectionTitle'
import { PressButton, PressLink } from '../ui/Press'
import { ButterflyIcon } from '../ui/ButterflyIcon'
import { Icon } from '../ui/Icons'
import { vibrate } from '../../lib/haptics'
import { celebrate } from '../../lib/celebrate'
import { now } from '../../lib/debug'
import { indice } from '../../lib/secoes'

const r = convite.rsvp
const prazo = r.prazo ? new Date(`${r.prazo}T23:59:59-03:00`) : null
const prazoTxt = prazo
  ? new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone: convite.festa.fusoHorario }).format(prazo)
  : ''

function waUrl(nome: string, recado: string) {
  const linhas = [`Olá! 🦋 Confirmo presença no aniversário de ${convite.crianca.nome}!`, '', `Nome: ${nome}`]
  if (recado.trim()) linhas.push(`Recado: ${recado.trim()}`)
  return `https://wa.me/${r.whatsapp}?text=${encodeURIComponent(linhas.join('\n'))}`
}

/** Check desenhado (traço animado). */
function Check() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <motion.path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
      />
    </svg>
  )
}

export function Rsvp() {
  const id = useId()
  const [nome, setNome] = useState('')
  const [recado, setRecado] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [shake, setShake] = useState(0)
  const [stage, setStage] = useState<'form' | 'check' | 'ok'>('form')
  const [url, setUrl] = useState<string | null>(null)
  const nomeRef = useRef<HTMLInputElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)
  const timer = useRef(0)
  const passouPrazo = !!prazo && now() > prazo.getTime()
  const semWhats = !r.whatsapp

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (stage !== 'form') return
    const n = nome.trim().replace(/\s+/g, ' ')
    if (n.length < 2) {
      setErro(n.length === 0 ? 'Conta pra gente o seu nome 💜' : 'Seu nome parece curtinho demais — pode completar?')
      setShake((s) => s + 1)
      vibrate([30, 40, 30])
      nomeRef.current?.focus()
      return
    }
    setErro(null)
    vibrate([20, 40, 20, 40, 60])
    const link = semWhats ? null : waUrl(n, recado)
    setUrl(link)
    // 1) o botão vira um check  2) a tela solta borboletas + confete  3) abre o WhatsApp
    setStage('check')
    celebrate(submitRef.current, 'grande')
    timer.current = window.setTimeout(() => {
      setStage('ok')
      if (link) window.location.href = link
    }, 1500)
  }

  return (
    <section id="confirmar" aria-labelledby="t-rsvp" className="wrap pb-14">
      <SectionTitle id="t-rsvp" index={indice('confirmar')} kicker="Confirmação de presença" title="Você vem?" />
      <Card blur className="reveal p-5">
        <AnimatePresence mode="wait" initial={false}>
          {stage !== 'ok' ? (
            <motion.form key="form" noValidate onSubmit={submit} exit={{ opacity: 0, scale: 0.97 }} className="flex flex-col gap-5">
              <p className="text-[16px] font-medium leading-relaxed text-tinta-2">
                {!prazo ? (
                  <>Confirme sua presença para prepararmos tudo com carinho.</>
                ) : passouPrazo ? (
                  <>O prazo era até {prazoTxt}, mas ainda dá para avisar a família 💜</>
                ) : (
                  <>
                    Confirme até <strong className="font-bold text-violeta-txt">{prazoTxt}</strong> para prepararmos tudo com carinho.
                  </>
                )}
              </p>

              <motion.div key={shake} animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : undefined} transition={{ duration: 0.4 }}>
                <label htmlFor={`${id}-nome`} className="label mb-2 block">
                  Seu nome
                </label>
                <input
                  ref={nomeRef}
                  id={`${id}-nome`}
                  name="nome"
                  type="text"
                  inputMode="text"
                  autoComplete="name"
                  autoCapitalize="words"
                  enterKeyHint="next"
                  maxLength={60}
                  value={nome}
                  onChange={(e) => {
                    setNome(e.target.value)
                    if (erro) setErro(null)
                  }}
                  aria-invalid={!!erro}
                  aria-describedby={erro ? `${id}-erro` : undefined}
                  placeholder="Ex.: Ana e família"
                  className="field"
                />
                <AnimatePresence>
                  {erro && (
                    <motion.p
                      id={`${id}-erro`}
                      role="alert"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-2 text-[15px] font-semibold text-magenta-txt"
                    >
                      {erro}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              <div>
                <label htmlFor={`${id}-recado`} className="label mb-2 flex justify-between gap-2">
                  <span>Recado para a {convite.crianca.nome.split(' ')[0]} (opcional)</span>
                  <span className="mono" aria-hidden="true">
                    {recado.length}/280
                  </span>
                </label>
                <textarea
                  id={`${id}-recado`}
                  name="recado"
                  inputMode="text"
                  enterKeyHint="done"
                  rows={3}
                  maxLength={280}
                  value={recado}
                  onChange={(e) => setRecado(e.target.value)}
                  placeholder="Escreva um carinho ✨"
                  className="field resize-none py-3.5 leading-relaxed"
                />
              </div>

              <PressButton ref={submitRef} type="submit" className="sheen-loop mt-1 h-[60px] w-full" aria-live="polite">
                <AnimatePresence mode="wait" initial={false}>
                  {stage === 'check' ? (
                    <motion.span
                      key="check"
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 16 }}
                      className="inline-flex items-center gap-2"
                    >
                      <Check />
                      Confirmado!
                    </motion.span>
                  ) : (
                    <motion.span key="txt" exit={{ scale: 0.6, opacity: 0 }} className="inline-flex items-center gap-2.5">
                      <ButterflyIcon size={24} speed={0.3} light />
                      Confirmar presença
                    </motion.span>
                  )}
                </AnimatePresence>
              </PressButton>
              <p className="-mt-2 text-center text-[14px] font-medium text-tinta-2">
                {semWhats ? 'Confirmação pelo WhatsApp em breve.' : 'Vamos abrir o WhatsApp com a mensagem pronta.'}
              </p>
            </motion.form>
          ) : (
            <motion.div
              key="ok"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="flex flex-col items-center gap-3 py-3 text-center"
              role="status"
            >
              <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-btn-a to-btn-b text-white shadow-lg">
                <Check />
              </span>
              <p className="serif text-[52px] leading-none text-roxo">Oba!</p>
              <p className="text-[18px] font-bold text-roxo">Presença confirmada 💜</p>
              {url ? (
                <>
                  <p className="text-[15px] font-medium text-tinta-2">Abrindo o WhatsApp com a sua mensagem…</p>
                  <PressLink href={url} className="mt-2 w-full">
                    <Icon name="whatsapp" size={20} />
                    Abrir WhatsApp
                  </PressLink>
                </>
              ) : (
                <p className="text-[15px] font-medium text-tinta-2">
                  O WhatsApp para confirmação ainda não foi configurado. Avise a família da {convite.crianca.nome.split(' ')[0]} por mensagem 💜
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  clearTimeout(timer.current)
                  setStage('form')
                }}
                className="min-h-12 px-4 text-[15px] font-semibold text-violeta-txt underline underline-offset-4"
              >
                Editar confirmação
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </section>
  )
}
