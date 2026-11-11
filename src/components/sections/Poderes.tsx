import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Card } from '../ui/Card'
import { SectionTitle } from '../ui/SectionTitle'
import { PressButton } from '../ui/Press'
import { indice } from '../../lib/secoes'
import { PODERES, type PoderId } from '../../poderes/catalogo'
import { poderes } from '../../poderes/estado'
import { acionar, carregarMotor } from '../../poderes/acionar'
import { vibrate } from '../../lib/haptics'

/* Mão-fantasma: contorno fino com a ponta do indicador em (0,0). */
const MAO =
  'M-5 4Q-5-1 0-1Q5-1 5 4L5 30Q7 26 11 26Q16 26 16 31Q18 28 22 28Q27 28 27 33Q29 31 32 31Q36 31 36 36L36 52Q36 66 24 70L2 70Q-6 66-10 56L-17 42Q-20 36-15 34Q-11 33-8 38L-5 44Z'
const MAO2 =
  'M-5 4Q-5-1 0-1Q5-1 5 4L5 22L7 22L7 1Q7-4 12-4Q17-4 17 1L17 30Q19 28 22 28Q27 28 27 33Q29 31 32 31Q36 31 36 36L36 52Q36 66 24 70L2 70Q-6 66-10 56L-17 42Q-20 36-15 34Q-11 33-8 38L-5 44Z'

function Mao({ dois = false }: { dois?: boolean }) {
  return <path className="mao" d={dois ? MAO2 : MAO} transform="scale(.62)" />
}

/** Palco com a mão-fantasma mostrando o gesto de cada poder (animações CSS, param fora da tela). */
function Palco({ id }: { id: PoderId }) {
  return (
    <div className={`palco g-${id}`} aria-hidden="true">
      <svg viewBox="0 0 120 103">
        {id === 'tempestade' && (
          <>
            <path className="rastro-gesto r" d="M60 16 L60 84" />
            <g transform="translate(60 50)">
              <g className="m">
                <Mao />
              </g>
            </g>
          </>
        )}
        {id === 'impacto' && (
          <>
            <circle className="toque t" cx="60" cy="50" r="10" />
            <g transform="translate(60 50)">
              <g className="m">
                <Mao />
              </g>
            </g>
          </>
        )}
        {id === 'rajada' && (
          <>
            <path className="rastro-gesto r" d="M60 54 L60 6" strokeWidth="5" />
            <circle className="toque t" cx="60" cy="54" r="10" />
            <g transform="translate(60 54)">
              <g className="m">
                <Mao />
              </g>
            </g>
          </>
        )}
        {id === 'magia' && (
          <>
            <circle className="rastro-gesto r" cx="60" cy="51.5" r="18" strokeDasharray="3 5" />
            <g className="m">
              <g transform="translate(60 51.5)">
                <Mao />
              </g>
            </g>
          </>
        )}
        {id === 'portal' && (
          <>
            <path className="rastro-gesto r" d="M60 22 a30 30 0 1 1 -0.1 0" />
            <g className="m">
              <Mao />
            </g>
          </>
        )}
        {id === 'cosmico' && (
          <>
            <circle className="toque t" cx="60" cy="50" r="8" />
            <circle className="toque t" cx="67.4" cy="47.5" r="8" />
            <g transform="translate(60 50)">
              <g className="m">
                <Mao dois />
              </g>
            </g>
          </>
        )}
      </svg>
    </div>
  )
}

const useVersao = () => useSyncExternalStore(poderes.subscribe, poderes.versao)

export function Poderes() {
  useVersao()
  const total = poderes.total()
  const [rodando, setRodando] = useState<PoderId | 'sobrecarga' | null>(null)
  const [mensagem, setMensagem] = useState(false)
  const secao = useRef<HTMLElement>(null)
  const timer = useRef(0)

  // o motor (chunk separado) baixa quando a seção se aproxima da tela
  useEffect(() => {
    const el = secao.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        void carregarMotor()
      },
      { rootMargin: '700px 0px' },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      clearTimeout(timer.current)
    }
  }, [])

  const disparar = async (id: PoderId) => {
    if (rodando) return
    setRodando(id)
    try {
      await acionar.demo(id)
    } finally {
      setRodando(null)
    }
  }
  const sobrecarga = async () => {
    if (rodando || total < 6) return
    setRodando('sobrecarga')
    vibrate([30, 30, 30, 30, 120])
    try {
      await acionar.sobrecarga()
      setMensagem(true)
      clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setMensagem(false), 4200)
    } finally {
      setRodando(null)
    }
  }

  return (
    <section ref={secao} id="poderes" aria-labelledby="t-poderes" className="wrap secao compacta acc-dourado">
      <SectionTitle id="t-poderes" index={indice('poderes')} kicker="Treinamento de agente" title="Poderes" />
      <Card className="reveal mb-(--gap)">
        <p className="px-(--pad) pt-(--pad) t-texto leading-relaxed txt-2">Faça os gestos em qualquer lugar do convite, ou toque em Disparar. Ative os 6 para destravar a sobrecarga.</p>
        <div className="flex items-center justify-between gap-3 px-(--pad) pb-2.5 pt-3">
          <span className="rotulo t-rotulo acc-txt">Poderes</span>
          <span className="mono t-contador leading-none text-branco" aria-live="polite">
            {total}/6
            <span className="sr-only"> poderes ativados</span>
          </span>
        </div>
        <div className="medidor px-(--pad) pb-(--pad)" aria-hidden="true">
          {PODERES.map((p) => (
            <span key={p.id} className={`${p.acc} ${poderes.tem(p.id) ? 'on' : ''}`} />
          ))}
        </div>
      </Card>

      <div className="poderes-grade">
        {PODERES.map((p) => (
          <Card key={p.id} acc={p.acc} className={`reveal poder ${poderes.tem(p.id) ? 'ativado' : ''}`}>
            <Palco id={p.id} />
            <div className="flex flex-1 flex-col gap-1.5 p-(--pad-mini)">
              <div className="flex items-start justify-between gap-2">
                <h3 className="display t-poder leading-[0.95] text-branco">{p.nome}</h3>
                {poderes.tem(p.id) && (
                  <span className="mono mt-1 t-rotulo acc-txt" aria-label="ativado">
                    OK
                  </span>
                )}
              </div>
              <p className="flex-1 t-dica leading-snug txt-2">{p.gesto}</p>
              <PressButton variant="soft" className="!min-h-(--btn-h-mini) w-full !px-2 !text-(length:--fs-rotulo) !tracking-[0.18em]" disabled={!!rodando} onClick={() => disparar(p.id)}>
                {rodando === p.id ? 'Ativando' : 'Disparar'}
              </PressButton>
            </div>
          </Card>
        ))}
      </div>

      <Card acc="acc-roxo" className="reveal mt-(--gap) p-(--pad) text-center">
        <p className="rotulo t-rotulo acc-txt">Sobrecarga</p>
        <p className="mt-1.5 t-texto leading-snug txt-2">{total < 6 ? `Ative os 6 poderes para destravar (faltam ${6 - total}).` : 'Tudo destravado. Todos os poderes juntos.'}</p>
        <PressButton className="btn-sobrecarga mt-2.5 w-full" disabled={total < 6 || !!rodando} onClick={sobrecarga}>
          {total < 6 ? 'Bloqueada' : rodando === 'sobrecarga' ? 'Sobrecarga' : 'Ativar sobrecarga'}
        </PressButton>
      </Card>

      {createPortal(
        <AnimatePresence>
          {mensagem && (
            <motion.div key="msg" className="mensagem-final" role="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <motion.div initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}>
                <p className="display metal text-[clamp(40px,12vw,64px)]">Todos os poderes ativados.</p>
                <p className="display metal-ouro mt-3 text-[clamp(44px,13vw,72px)]">Te espero na festa!</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </section>
  )
}
