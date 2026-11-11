import { useEffect } from 'react'
import { useOpened } from '../hooks/useStores'
import { initScroll } from '../lib/scroll'
import { appState } from '../lib/appState'

// (etapa da abertura) App provisório: só o fundo e o título. O hero completo entra na próxima etapa.
export function App() {
  const opened = useOpened()
  useEffect(() => {
    initScroll()
    appState.mounted()
  }, [])
  return (
    <main className="page" aria-hidden={!opened} style={{ minHeight: '100svh', background: 'radial-gradient(120% 60% at 50% 0%, #142038, #05070C 65%)' }}>
      <section id="inicio" style={{ padding: '30vh 20px 0', textAlign: 'center' }}>
        <h1 style={{ margin: 0, font: "400 72px/.9 'Bebas Neue', sans-serif", letterSpacing: '.04em', color: '#E9EEF5' }}>João Lucas</h1>
        <p style={{ margin: '14px 0 0', font: "600 13px/1 Inter, sans-serif", letterSpacing: '.32em', color: '#7FB8FF' }}>5 ANOS · UMA NOVA MISSÃO</p>
      </section>
    </main>
  )
}
