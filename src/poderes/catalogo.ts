/** Os 6 poderes: nome, cor de destaque e o gesto que dispara cada um. */
export type PoderId = 'tempestade' | 'impacto' | 'rajada' | 'magia' | 'portal' | 'cosmico'

export interface InfoPoder {
  id: PoderId
  nome: string
  /** classe de cor de destaque (index.css) */
  acc: string
  /** "r g b" do brilho principal (clarão e brilho suave) */
  rgb: string
  /** como fazer o gesto (texto curto) */
  gesto: string
}

export const PODERES: InfoPoder[] = [
  { id: 'tempestade', nome: 'Tempestade', acc: 'acc-azul', rgb: '30 144 255', gesto: 'Arraste rápido de cima para baixo' },
  { id: 'impacto', nome: 'Impacto', acc: 'acc-vermelho', rgb: '255 90 30', gesto: 'Toque duas vezes num ponto' },
  { id: 'rajada', nome: 'Rajada de energia', acc: 'acc-fogo', rgb: '255 140 40', gesto: 'Segure para carregar e solte' },
  { id: 'magia', nome: 'Magia', acc: 'acc-violeta', rgb: '155 92 255', gesto: 'Gire o dedo em círculos' },
  { id: 'portal', nome: 'Portal', acc: 'acc-turquesa', rgb: '20 200 196', gesto: 'Desenhe um círculo fechado' },
  { id: 'cosmico', nome: 'Energia cósmica', acc: 'acc-dourado', rgb: '245 183 0', gesto: 'Segure com dois dedos (ou segure bem longo)' },
]

export const infoPoder = (id: PoderId) => PODERES.find((p) => p.id === id)!
