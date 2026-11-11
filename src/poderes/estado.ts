/**
 * Contador "PODERES n/6": quais poderes a pessoa já ativou (por gesto ou botão).
 * Fica guardado neste aparelho (localStorage) só por conveniência; sem ele, recomeça do zero.
 */
import { PODERES, type PoderId } from './catalogo'

const CHAVE = 'convite-jl-poderes'
type L = () => void

function ler(): PoderId[] {
  try {
    const v = JSON.parse(localStorage.getItem(CHAVE) || '[]')
    return Array.isArray(v) ? v.filter((x) => PODERES.some((p) => p.id === x)) : []
  } catch {
    return []
  }
}

let ativados = new Set<PoderId>(ler())
let versao = 0
const ls = new Set<L>()

export const poderes = {
  tem: (id: PoderId) => ativados.has(id),
  total: () => ativados.size,
  /** muda a cada novo poder (snapshot do useSyncExternalStore) */
  versao: () => versao,
  marcar(id: PoderId) {
    if (ativados.has(id)) return
    ativados = new Set(ativados).add(id)
    versao++
    try {
      localStorage.setItem(CHAVE, JSON.stringify([...ativados]))
    } catch {
      /* sem armazenamento: só nesta visita */
    }
    ls.forEach((l) => l())
  },
  subscribe(l: L) {
    ls.add(l)
    return () => {
      ls.delete(l)
    }
  },
}
