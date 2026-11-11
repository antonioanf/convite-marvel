/** Numeração das seções ("02/06") de acordo com as que estão ligadas no config. */
import { convite } from '../config/convite'

const s = convite.secoes
const ordem = [
  s.contagem && 'contagem',
  s.local && 'local',
  s.galeria && 'galeria',
  s.velinhas && 'velinhas',
  s.rsvp && 'confirmar',
  s.pix && convite.pix && 'presentes',
].filter(Boolean) as string[]

const pad = (n: number) => String(n).padStart(2, '0')

export function indice(id: string) {
  const i = ordem.indexOf(id)
  return i < 0 ? undefined : `${pad(i + 1)}/${pad(ordem.length)}`
}
