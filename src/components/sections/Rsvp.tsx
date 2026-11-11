import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { convite } from '../../config/convite'
import { Card } from '../ui/Card'
import { SectionTitle } from '../ui/SectionTitle'
import { PressButton, PressLink } from '../ui/Press'
import { Emblema } from '../ui/Emblema'
import { Icon } from '../ui/Icons'
import { vibrate } from '../../lib/haptics'
import { now } from '../../lib/debug'
import { indice } from '../../lib/secoes'
import { perf } from '../../lib/perf'
import { sfx } from '../../lib/sfx'
import { dataTrailer } from '../../lib/datas'
import { missaoTxt, numeroCredencial, salvarCredencial } from '../../lib/credencial'
import { acionar } from '../../poderes/acionar'

const r = convite.rsvp
const prazo = r.prazo ? new Date(`${r.prazo}T23:59:59-03:00`) : null
const prazoTxt = prazo ? new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone: convite.festa.fusoHorario }).format(prazo) : ''
const primeiro = convite.crianca.nome.split(' ')[0]

function waUrl(nome: string) {
  const c = convite.crianca
  const linhas = [
    'MISSÃO ACEITA!',
    `Confirmo presença no aniversário de ${c.idade} anos do ${c.nome}.`,
    `${dataTrailer.charAt(0) + dataTrailer.slice(1).toLowerCase()} · ${convite.festa.local}`,
    '',
    `Agente: ${nome}`,
  ]
  return `https://wa.me/${r.whatsapp}?text=${encodeURIComponent(linhas.join('\n'))}`
}

/** A credencial na tela (a versão PNG é desenhada em lib/credencial.ts com o mesmo conteúdo). */
function Credencial({ nome }: { nome: string }) {
  return (
    <div className="credencial" role="img" aria-label={`Credencial de agente de ${nome}: ${missaoTxt}, aprovado.`}>
      <span className="reflexo" aria-hidden="true" />
      <div className="relative flex items-center gap-4" aria-hidden="true">
        <Emblema size={68} id="cred" className="shrink-0 drop-shadow-[0_0_14px_rgb(255_106_0/.5)]" />
        <div className="min-w-0">
          <p className="rotulo text-[10px] text-violeta-txt">Credencial de agente</p>
          <p className="display metal mt-1 truncate text-[38px]">{nome}</p>
          <p className="mono mt-1 text-[16px] text-dourado">{missaoTxt}</p>
        </div>
      </div>
      <div className="relative mt-4 flex items-end justify-between" aria-hidden="true">
        <p className="mono text-[13px] txt-2">Nº {numeroCredencial(nome)}</p>
        <span className="selo-aprovado">Aprovado</span>
      </div>
    </div>
  )
}

export function Rsvp() {
  const id = useId()
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [tremor, setTremor] = useState(0)
  const [etapa, setEtapa] = useState<'form' | 'portal' | 'ok'>('form')
  const [aceito, setAceito] = useState('')
  const [img, setImg] = useState<{ url: string; como: string } | null>(null)
  const [salvando, setSalvando] = useState(false)
  const nomeRef = useRef<HTMLInputElement>(null)
  const cartao = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])
  const passouPrazo = !!prazo && now() > prazo.getTime()
  const semWhats = !r.whatsapp
  const link = aceito && !semWhats ? waUrl(aceito) : null

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (etapa !== 'form') return
    const n = nome.trim().replace(/\s+/g, ' ')
    if (n.length < 2) {
      setErro(n.length === 0 ? 'Digite o seu nome para aceitar a missão.' : 'Esse nome está curto demais. Pode completar?')
      setTremor((s) => s + 1)
      vibrate([30, 40, 30])
      nomeRef.current?.focus()
      return
    }
    setErro(null)
    setAceito(n)
    setImg(null)
    nomeRef.current?.blur()
    // 1) o portal se abre no cartão  2) sai a credencial  3) abre o WhatsApp (se configurado)
    const b = cartao.current?.getBoundingClientRect()
    if (b) acionar.portalCredencial({ x: b.left + b.width / 2, y: Math.min(innerHeight * 0.6, Math.max(innerHeight * 0.3, b.top + b.height / 2)) }, Math.min(innerWidth, innerHeight) * 0.3)
    setEtapa('portal')
    vibrate([20, 40, 20, 40, 60])
    timers.current.push(
      window.setTimeout(() => {
        setEtapa('ok')
        sfx.aprovado()
        vibrate([40, 30, 80])
      }, perf.reducedMotion ? 200 : 1100),
    )
    if (!semWhats) timers.current.push(window.setTimeout(() => (window.location.href = waUrl(n)), perf.reducedMotion ? 2200 : 3600))
  }

  const salvar = async () => {
    if (salvando) return
    setSalvando(true)
    try {
      setImg(await salvarCredencial(aceito))
    } catch {
      setImg(null)
    } finally {
      setSalvando(false)
    }
  }

  const editar = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setEtapa('form')
    setImg(null)
  }

  return (
    <section id="confirmar" aria-labelledby="t-rsvp" className="wrap secao acc-roxo">
      <SectionTitle id="t-rsvp" index={indice('confirmar')} kicker="Confirmação de presença" title="Aceitar missão" />
      <div ref={cartao}>
        <Card className="reveal p-5">
          <AnimatePresence mode="wait" initial={false}>
            {etapa === 'form' ? (
              <motion.form key="form" noValidate onSubmit={enviar} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25 }} className="flex flex-col gap-5">
                <p className="text-[16px] font-medium leading-relaxed txt-2">
                  {!prazo ? (
                    <>Digite seu nome para receber a credencial de agente e confirmar presença.</>
                  ) : passouPrazo ? (
                    <>O prazo era até {prazoTxt}, mas ainda dá para avisar a família.</>
                  ) : (
                    <>
                      Confirme até <strong className="font-bold text-roxo-txt">{prazoTxt}</strong> e receba a credencial de agente.
                    </>
                  )}
                </p>
                <motion.div key={tremor} animate={tremor ? { x: [0, -10, 10, -6, 6, 0] } : undefined} transition={{ duration: 0.4 }}>
                  <label htmlFor={`${id}-nome`} className="rotulo mb-2 block text-[11px]">
                    Seu nome
                  </label>
                  <input
                    ref={nomeRef}
                    id={`${id}-nome`}
                    name="nome"
                    type="text"
                    autoComplete="name"
                    autoCapitalize="words"
                    enterKeyHint="send"
                    maxLength={40}
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
                  {erro && (
                    <p id={`${id}-erro`} role="alert" className="mt-2 text-[15px] font-semibold text-vermelho-txt">
                      {erro}
                    </p>
                  )}
                </motion.div>
                <PressButton type="submit" className="h-[60px] w-full">
                  Aceitar missão
                </PressButton>
                <p className="-mt-2 text-center text-[14px] font-medium txt-2">{semWhats ? 'A confirmação pelo WhatsApp ainda não foi configurada.' : 'Depois abrimos o WhatsApp com a mensagem pronta.'}</p>
              </motion.form>
            ) : etapa === 'portal' ? (
              <motion.div key="portal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid min-h-[220px] place-items-center text-center" role="status">
                <p className="rotulo text-[12px] acc-txt">Abrindo portal…</p>
              </motion.div>
            ) : (
              <motion.div
                key="ok"
                initial={perf.reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.3, rotate: -8, y: 30 }}
                animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
                transition={{ duration: 0.9, ease: [0.2, 0.9, 0.2, 1.05] }}
                className="flex flex-col gap-4"
                role="status"
              >
                <p className="text-center text-[17px] font-bold text-branco">Missão aceita, {aceito.split(' ')[0]}!</p>
                <Credencial nome={aceito} />
                <PressButton variant="soft" className="w-full" onClick={salvar} disabled={salvando}>
                  <Icon name="baixar" size={20} />
                  {salvando ? 'Gerando…' : 'Salvar credencial'}
                </PressButton>
                {img && (
                  <div className="flex flex-col items-center gap-2 text-center" data-sem-gesto>
                    <p className="text-[14px] font-medium txt-2">{img.como === 'baixado' ? 'Credencial baixada. Se não apareceu, toque e segure a imagem para salvar:' : 'Toque e segure a imagem para salvar:'}</p>
                    <img src={img.url} alt={`Credencial de agente de ${aceito}`} className="w-full rounded-lg" style={{ WebkitTouchCallout: 'default', userSelect: 'auto' }} />
                  </div>
                )}
                {link ? (
                  <PressLink href={link} className="w-full">
                    <Icon name="whatsapp" size={20} />
                    Abrir WhatsApp
                  </PressLink>
                ) : (
                  <p className="rounded-md border border-[rgb(var(--dourado-rgb)/.5)] bg-[rgb(var(--dourado-rgb)/.08)] px-4 py-3 text-center text-[15px] font-medium text-branco" role="note">
                    O WhatsApp para confirmação ainda não foi configurado. Avise a família do {primeiro} por mensagem.
                  </p>
                )}
                <button type="button" onClick={editar} className="min-h-12 px-4 text-[15px] font-semibold text-roxo-txt underline underline-offset-4">
                  Corrigir o nome
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </section>
  )
}
