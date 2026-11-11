import { useEffect } from 'react'
import { useOpened } from '../hooks/useStores'
import { initScroll } from '../lib/scroll'
import { appState } from '../lib/appState'
import { Heroi } from '../components/herois/Heroi'

// (etapa da intro) App provisório: céu + a equipe. O hero completo entra na próxima etapa.
export function App() {
  const opened = useOpened()
  useEffect(() => {
    initScroll()
    appState.mounted()
  }, [])
  return (
    <>
      <div className="ceu" aria-hidden="true" />
      <main className="page" aria-hidden={!opened}>
        <section id="inicio" className="wrap pt-10">
          <h1 className="hq-pop text-center text-[54px] text-amarelo">João Lucas</h1>
          <div className="relative mx-auto mt-4 aspect-[390/500] max-w-[430px]">
            <Heroi id="faisca" className="absolute left-[-3%] top-0 w-[40%]" pisca={-1} />
            <Heroi id="astra" className="absolute left-[63%] top-0 w-[40%]" pisca={-2} />
            <Heroi id="tremor" className="absolute left-[-7%] top-[38%] z-[3] w-[46%]" pisca={-3} />
            <Heroi id="turbo" className="absolute left-[62%] top-[35%] z-[3] w-[44%]" pisca={-4} />
            <Heroi id="joao" className="absolute left-[16%] top-[10%] z-[2] w-[68%]" />
          </div>
        </section>
      </main>
    </>
  )
}
