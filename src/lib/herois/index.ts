/**
 * A Equipe do João Lucas: 5 heróis originais em estilo chibi.
 * `heroiSvg(id, pose, paleta)` devolve o SVG pronto (texto). Mesma fonte para intro, React e PNG.
 */
import type { Paleta } from '../../config/convite.ts'
import { svgHeroi, type Pose } from './base.ts'
import { joao } from './joao.ts'
import { faisca } from './faisca.ts'
import { tremor } from './tremor.ts'
import { turbo } from './turbo.ts'
import { astra } from './astra.ts'

export type { Pose }
export type HeroiId = 'joao' | 'faisca' | 'tremor' | 'turbo' | 'astra'
export type PoderId = 'tempestade' | 'impacto' | 'fogo' | 'portal'

export interface HeroiInfo {
  id: HeroiId
  nome: string
  titulo: string
  poder: PoderId | null
  poderNome: string
  /** fala no balão quando alguém toca nele */
  fala: string
  /** cor de acento (chave da paleta) */
  acento: keyof Omit<Paleta, never>
  /** flutua em vez de ficar no chão */
  voa?: boolean
  desenho: (p: Paleta, pose: Pose) => string
}

export const EQUIPE: Record<HeroiId, HeroiInfo> = {
  joao: { id: 'joao', nome: 'João Lucas', titulo: 'o Líder', poder: null, poderNome: 'Liderança', fala: 'Equipe, vamos nessa!', acento: 'vermelho', desenho: joao },
  faisca: { id: 'faisca', nome: 'Faísca', titulo: 'Tempestade Elétrica', poder: 'tempestade', poderNome: 'Tempestade Elétrica', fala: 'Zap! Que energia!', acento: 'turquesa', desenho: faisca },
  tremor: { id: 'tremor', nome: 'Tremor', titulo: 'Super Impacto', poder: 'impacto', poderNome: 'Super Impacto', fala: 'Segura que lá vem!', acento: 'mostarda', desenho: tremor },
  turbo: { id: 'turbo', nome: 'Turbo', titulo: 'Jato de Fogo', poder: 'fogo', poderNome: 'Jato de Fogo', fala: 'Vrummm! Partiu!', acento: 'fogo', voa: true, desenho: turbo },
  astra: { id: 'astra', nome: 'Astra', titulo: 'Portal Mágico', poder: 'portal', poderNome: 'Portal Mágico', fala: 'Brilha, estrelinha!', acento: 'lilas', desenho: astra },
}

/** Os 4 parceiros com poder (na ordem da Arena). */
export const PARCEIROS: HeroiId[] = ['faisca', 'tremor', 'turbo', 'astra']

export function heroiSvg(id: HeroiId, pose: Pose, p: Paleta, o: { attrs?: string; title?: string } = {}) {
  const h = EQUIPE[id]
  return svgHeroi(id, pose, p.marinho, h.desenho(p, pose), { ...o, flutua: h.voa, sombraRx: id === 'tremor' ? 54 : 46 })
}
