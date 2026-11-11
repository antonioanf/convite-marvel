/**
 * Faísca: menina de rabo de cavalo alto com uma mecha em zigue-zague brilhante, óculos de aviador
 * na testa, uniforme branco com ombros e calça turquesa e botas brancas com raios.
 * Poder: Tempestade Elétrica. Normal: faisquinhas nas mãos. Ataque: braços para cima com um arco elétrico.
 */
import type { Paleta } from '../../config/convite.ts'
import { boca, bochechas, cabeca, estrela, forma, mao, membro, olhos, orelhas, pernas, sk, sobrancelhas, tronco, type Pose } from './base.ts'

const raio = (d: string, cor: string, w = 5) =>
  `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${w * 2.6}" stroke-linecap="round" stroke-linejoin="round" opacity=".28"/>` +
  `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="${d}" fill="none" stroke="#fff" stroke-width="${w * 0.4}" stroke-linecap="round" stroke-linejoin="round"/>`

export function faisca(p: Paleta, pose: Pose) {
  const O = p.marinho
  const pele = '#E8B48C'
  const cabelo = '#3A2416'
  const tq = p.turquesa
  const branco = '#F4FBFF'
  const at = pose === 'ataque'
  let s = ''

  // rabo de cavalo (atrás da cabeça, para a direita)
  s += forma('M138 44 Q178 18 194 42 Q182 44 180 56 Q192 68 184 88 Q172 66 150 64 Z', cabelo, O)
  s += `<path d="M160 36 Q176 32 184 44" fill="none" stroke="#fff" stroke-width="2.5" opacity=".2" stroke-linecap="round"/>`

  // calça turquesa + botas brancas com raio
  s += pernas(tq, branco, O, {
    abertas: at,
    detalhe: (xl, xr, w) =>
      `<path d="M${xl + 1} 232 l5 -4 l1 5 l5 -4" fill="none" stroke="${tq}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="M${xr + w - 12} 232 l5 -4 l1 5 l5 -4" fill="none" stroke="${tq}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  })

  // tronco branco com ombros turquesa e um raio no peito
  s += tronco(branco, O)
  s += `<path d="M72 150 Q72 133 100 133 Q128 133 128 150 L128 156 Q100 166 72 156 Z" fill="${tq}" ${sk(O, 2.5)}/>`
  s += `<path d="M104 168 L94 182 L102 182 L95 196 L110 178 L102 178 L108 168 Z" fill="${p.amarelo}" ${sk(O, 2.2)}/>`
  s += `<rect x="70" y="194" width="60" height="7" rx="3" fill="#0E7C86"/>`

  // braços (mangas brancas, luvas turquesa)
  if (at) {
    s += membro('M76 148 Q36 142 26 104', branco, O) + mao(22, 94, tq, O, 10.5)
    s += membro('M124 148 Q164 142 174 104', branco, O) + mao(178, 94, tq, O, 10.5)
    s += `<g class="h-faisca">${raio('M22 82 L34 54 L27 50 L48 22 L41 18 L68 -4 L74 8 L92 -12 L100 2 L110 -12 L126 4 L132 -6 L159 18 L152 22 L173 50 L166 54 L178 82', tq, 5)}`
    s += `${estrela(22, 88, 16, p.amarelo, 'opacity=".9"')}${estrela(178, 88, 16, p.amarelo, 'opacity=".9"')}</g>`
  } else {
    s += membro('M76 150 Q62 168 58 184', branco, O) + mao(57, 189, tq, O, 10)
    s += membro('M124 150 Q138 168 142 184', branco, O) + mao(143, 189, tq, O, 10)
    s += `<g class="h-faisca">${raio('M44 196 l-6 6 l5 2 l-6 7', tq, 2.6)}${raio('M156 196 l6 6 l-5 2 l6 7', tq, 2.6)}${estrela(64, 200, 5, p.amarelo)}${estrela(136, 200, 5, p.amarelo)}</g>`
  }

  // cabeça
  s += orelhas(pele, O) + cabeca(pele, O)
  s += olhos(O, tq)
  s += sobrancelhas(cabelo, pose, 76)
  s += boca(O, at ? 'grito' : 'aberto') + bochechas()
  // franja de lado
  s += forma('M44 92 Q40 30 100 25 Q160 30 156 92 Q150 64 130 58 Q118 70 100 62 Q86 72 70 62 Q54 68 44 92 Z', cabelo, O)
  // mecha em zigue-zague brilhante
  s += `<g class="h-faisca">${raio('M146 50 L136 60 L146 63 L134 78', tq, 4.5)}</g>`
  // óculos de aviador na testa (alça marrom, lentes âmbar com aro prateado)
  s += `<path d="M45 58 Q100 22 155 58" fill="none" stroke="#7A4A25" stroke-width="7" stroke-linecap="round"/>`
  s += `<path d="M45 58 Q100 22 155 58" fill="none" stroke="${O}" stroke-width="1.5" opacity=".4"/>`
  for (const x of [80, 120]) {
    s += `<circle cx="${x}" cy="38" r="12.5" fill="#C9D3DF" ${sk(O, 3)}/><circle cx="${x}" cy="38" r="8.5" fill="#FFC857" stroke="${O}" stroke-width="1.5"/>`
    s += `<path d="M${x - 4} 34 l4 -2" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`
  }
  s += `<rect x="92" y="35" width="16" height="6" rx="3" fill="#C9D3DF" ${sk(O, 2)}/>`
  return s
}
