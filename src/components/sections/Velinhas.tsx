import { convite } from '../../config/convite'
import { Card } from '../ui/Card'
import { Photo } from '../ui/Photo'
import { SectionTitle } from '../ui/SectionTitle'
import { Candles } from '../fun/Candles'
import { indice } from '../../lib/secoes'

/** Seção "Faça um pedido": foto do bolo + bolinho com as velas para apagar segurando o dedo (ou soprando). */
export function Velinhas() {
  const foto = convite.fotoBolo
  return (
    <section id="velinhas" aria-labelledby="t-velinhas" className="wrap pb-14">
      <SectionTitle id="t-velinhas" index={indice('velinhas')} kicker="Faça um pedido" title="Sopre as velinhas" />
      <div className="grid grid-cols-5 gap-3">
        <Card className="reveal col-span-3 p-1.5">
          <div className="relative overflow-hidden rounded-[22px]" style={{ aspectRatio: '3 / 4.4' }}>
            <div data-parallax className="absolute inset-[-7%_0]">
              <Photo foto={foto} sizes="(max-width: 480px) 56vw, 270px" />
            </div>
          </div>
        </Card>
        <Card holo className="reveal col-span-2 flex flex-col items-center justify-between p-3 text-center">
          <Candles />
        </Card>
      </div>
    </section>
  )
}
