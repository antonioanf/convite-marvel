/**
 * Turbo: menino de topete loiro bem alto, macacão prata com painéis azul-celeste, luvas azul-celeste,
 * botas-foguete prateadas com bocal laranja e uma mochila a jato pequenininha (dois tubinhos nas costas).
 * Poder: Jato de Fogo. Sempre flutuando um pouco. Normal: mãos na cintura. Ataque: braços para trás, chamas grandes.
 */
import type { Paleta } from '../../config/convite.ts'
import { boca, bochechas, cabeca, forma, mao, membro, olhos, orelhas, sk, sobrancelhas, tronco, type Pose } from './base.ts'

/** Chama (núcleo branco-amarelo, meio amarelo, fora laranja) saindo de (x, y) para baixo. */
function chama(x: number, y: number, h: number, w: number, fogo: string, amarelo: string) {
  return (
    `<path d="M${x - w} ${y} Q${x - w * 0.9} ${y + h * 0.55} ${x} ${y + h} Q${x + w * 0.9} ${y + h * 0.55} ${x + w} ${y} Z" fill="${fogo}" opacity=".95"/>` +
    `<path d="M${x - w * 0.62} ${y} Q${x - w * 0.5} ${y + h * 0.45} ${x} ${y + h * 0.72} Q${x + w * 0.5} ${y + h * 0.45} ${x + w * 0.62} ${y} Z" fill="${amarelo}"/>` +
    `<path d="M${x - w * 0.3} ${y} Q${x - w * 0.2} ${y + h * 0.3} ${x} ${y + h * 0.42} Q${x + w * 0.2} ${y + h * 0.3} ${x + w * 0.3} ${y} Z" fill="#FFF8E1"/>`
  )
}

export function turbo(p: Paleta, pose: Pose) {
  const O = p.marinho
  const pele = '#F6D2B4'
  const cabelo = '#F2B33D'
  const prata = '#D5DEE8'
  const celeste = '#38BDF8'
  const at = pose === 'ataque'
  let s = ''

  // mochila a jato (dois tubinhos atrás dos ombros) + chaminhas
  for (const x of [56, 126]) {
    s += `<rect x="${x}" y="128" width="18" height="44" rx="8" fill="${prata}" ${sk(O)}/>`
    s += `<rect x="${x + 2}" y="168" width="14" height="8" rx="2" fill="${p.fogo}" ${sk(O, 2.5)}/>`
    s += `<g class="h-chama">${chama(x + 9, 177, at ? 34 : 14, 6, p.fogo, p.amarelo)}</g>`
  }

  // pernas prata + botas-foguete com bocal laranja e chamas
  const dx = at ? 4 : 0
  for (const x of [80 - dx, 103 + dx]) {
    s += `<rect x="${x}" y="196" width="17" height="34" rx="7" fill="${prata}" ${sk(O)}/>`
    s += `<g class="h-chama">${chama(x + 8.5, 252, at ? 70 : 22, at ? 11 : 7, p.fogo, p.amarelo)}</g>`
    s += forma(`M${x - 5} 226 Q${x + 8.5} 220 ${x + 22} 226 L${x + 21} 246 L${x - 4} 246 Z`, celeste, O)
    s += `<rect x="${x + 1}" y="245" width="15" height="7" rx="2" fill="${p.fogo}" ${sk(O, 2.5)}/>`
    s += `<path d="M${x - 2} 234 H${x + 19}" stroke="${prata}" stroke-width="3"/>`
  }

  // macacão prata com painel celeste em V e cinto celeste
  s += tronco(prata, O)
  s += `<path d="M73 150 L100 176 L127 150 L127 160 L100 186 L73 160 Z" fill="${celeste}" ${sk(O, 2.2)}/>`
  s += `<rect x="70" y="192" width="60" height="8" rx="3" fill="${celeste}" ${sk(O, 2.2)}/>`
  s += `<circle cx="100" cy="196" r="5" fill="${p.amarelo}" ${sk(O, 2)}/>`

  // braços (mangas prata, luvas celeste)
  if (at) {
    s += membro('M76 150 Q62 168 50 180', prata, O) + mao(46, 184, celeste, O, 10.5)
    s += membro('M124 150 Q138 168 150 180', prata, O) + mao(154, 184, celeste, O, 10.5)
  } else {
    s += membro('M76 148 Q56 164 70 182', prata, O) + mao(71, 184, celeste, O, 10.5)
    s += membro('M124 148 Q144 164 130 182', prata, O) + mao(129, 184, celeste, O, 10.5)
  }

  // cabeça
  s += orelhas(pele, O) + cabeca(pele, O)
  s += olhos(O, '#E07A1F')
  s += sobrancelhas('#B7791F', pose, 74)
  s += boca(O, at ? 'grito' : 'aberto') + bochechas()
  // topete loiro bem alto
  s += forma(
    'M44 90 Q40 46 66 36 Q62 12 94 6 Q128 0 140 20 Q126 18 118 26 Q150 32 156 90 Q144 62 122 58 Q102 66 80 58 Q58 64 44 90 Z',
    cabelo,
    O,
  )
  s += `<path d="M76 30 Q90 14 116 12" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".45"/>`
  return s
}
