import { useEffect, useRef } from 'react'
import { useOpened } from '../../hooks/useStores'
import { onScrollPos, scrollPos } from '../../lib/scrollPos'
import { perf } from '../../lib/perf'

/**
 * Imagem de fundo das seções abaixo do hero (contagem, missão, poderes, aceitar missão, rodapé).
 * - Camada FIXA atrás do conteúdo (não usa background-attachment: fixed, que o iPhone ignora);
 *   o hero é opaco e cobre a camada, então ela só aparece do "ROLE" para baixo. A emenda com o hero
 *   é o degradê de 200 px (.transicao-fundo, no App).
 * - Parallax leve ao rolar, só com transform (sem parallax com prefers-reduced-motion).
 * - Por cima: camada escura #05070D + vinheta (o texto e os cartões continuam legíveis).
 * - Carregamento preguiçoso: a imagem só começa a baixar quando a pessoa rola ~1/4 da tela
 *   (perto do fim do hero) — não disputa com a abertura nem com o LCP. 750 px ou 1200 px (srcset).
 */
export function FundoSecoes() {
  const img = useRef<HTMLImageElement>(null)
  const opened = useOpened()

  useEffect(() => {
    if (!opened) return
    const el = img.current!
    let carregou = false
    let raf = 0
    let H = innerHeight
    let total = 1
    const medir = () => {
      H = innerHeight
      total = Math.max(1, document.documentElement.scrollHeight - H * 1.5)
      mover()
    }
    // parallax: a imagem sobe ~8% da altura da tela do começo ao fim das seções
    const mover = () => {
      raf = 0
      if (perf.reducedMotion || !carregou) return
      const k = Math.min(1, Math.max(0, (scrollPos.y - H * 0.5) / total))
      el.style.transform = `translate3d(0, ${(-k * H * 0.08).toFixed(1)}px, 0)`
    }
    const carregar = () => {
      if (carregou) return
      carregou = true
      el.onload = () => el.classList.add('pronta')
      el.sizes = '100vw'
      el.srcset = '/fotos/fundo-750.webp 750w, /fotos/fundo-1200.webp 1200w'
      el.src = '/fotos/fundo-750.webp'
      medir()
    }
    const rolou = () => {
      if (!carregou && scrollPos.y > innerHeight * 0.25) carregar()
      if (carregou && !raf) raf = requestAnimationFrame(mover)
    }
    const off = onScrollPos(rolou)
    rolou()
    const ro = new ResizeObserver(medir)
    ro.observe(document.body)
    return () => {
      off()
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [opened])

  return (
    <div className="fundo-secoes" aria-hidden="true">
      <img ref={img} alt="" decoding="async" />
    </div>
  )
}
