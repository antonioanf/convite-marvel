/**
 * João Lucas, o Líder: cabelo castanho, máscara de olhos azul-marinho, uniforme vermelho com
 * calção azul-marinho e detalhes amarelos (gola, cinto, punhos das botas), luvas brancas,
 * capa CURTA azul royal e o emblema "JL" (escudo com raio) no peito.
 * Normal: punho erguido ("vamos, equipe!"). Ataque: aponta para a frente, capa ao vento, punho brilhando.
 */
import type { Paleta } from '../../config/convite.ts'
import { emblemaG } from '../emblema.ts'
import { boca, bochechas, cabeca, estrela, forma, mao, membro, olhos, orelhas, pernas, sk, sobrancelhas, tronco, type Pose } from './base.ts'

export function joao(p: Paleta, pose: Pose) {
  const O = p.marinho
  const pele = '#F2C29B'
  const cabelo = '#6B3F1D'
  const luva = '#FFFFFF'
  const at = pose === 'ataque'
  let s = ''

  // capa curta (atrás)
  s += `<g class="h-capa">${forma(
    at
      ? 'M74 140 Q100 130 126 140 L132 192 Q116 210 98 200 Q80 214 62 204 Q46 210 34 196 Z'
      : 'M74 140 Q100 130 126 140 L142 200 Q131 209 121 201 Q111 211 100 202 Q89 211 79 201 Q69 209 58 200 Z',
    p.azul,
    O,
  )}<path d="${at ? 'M88 146 Q74 176 60 198' : 'M86 146 Q80 176 76 198 M114 146 Q120 176 124 198'}" fill="none" stroke="${O}" stroke-width="2.2" opacity=".3" stroke-linecap="round"/></g>`

  // pernas (calção marinho) + botas vermelhas com punho amarelo
  s += pernas(O, p.vermelho, O, {
    abertas: at,
    detalhe: (xl, xr, w) =>
      `<rect x="${xl - 1}" y="225" width="${w + 2}" height="7" rx="3" fill="${p.amarelo}" ${sk(O, 2.5)}/>` +
      `<rect x="${xr - 1}" y="225" width="${w + 2}" height="7" rx="3" fill="${p.amarelo}" ${sk(O, 2.5)}/>`,
  })

  // tronco vermelho, calção marinho, cinto amarelo, gola amarela, emblema
  s += tronco(p.vermelho, O)
  s += `<path d="M71 188 L129 188 L130 196 Q130 206 120 206 L80 206 Q70 206 70 196 Z" fill="${O}"/>`
  s += `<rect x="70" y="182" width="60" height="9" rx="3" fill="${p.amarelo}" ${sk(O, 2.5)}/>`
  s += `<path d="M86 134 L100 146 L114 134" fill="none" stroke="${p.amarelo}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`
  s += `<g transform="translate(86.5 147) scale(0.27)">${emblemaG(p)}</g>`

  // braços (mangas vermelhas, luvas brancas)
  if (at) {
    s += membro('M76 150 Q60 158 62 176', p.vermelho, O) + mao(62, 180, luva, O, 11)
    s += `<g class="h-brilho">${estrela(178, 128, 26, p.amarelo, 'opacity=".9"')}${estrela(178, 128, 13, '#fff')}</g>`
    s += membro('M124 150 Q150 148 170 134', p.vermelho, O) + mao(176, 130, luva, O, 11.5)
  } else {
    s += membro('M76 148 Q56 164 70 182', p.vermelho, O) + mao(71, 184, luva, O, 10.5)
    s += membro('M124 148 Q160 142 170 112', p.vermelho, O) + mao(172, 103, luva, O, 11.5)
    s += `<path d="M166 99 h12 M166 104 h12" stroke="${O}" stroke-width="2" stroke-linecap="round" opacity=".45"/>`
  }

  // cabeça
  s += orelhas(pele, O) + cabeca(pele, O)
  s += olhos(O, '#5B8DEF', { mascara: O })
  s += sobrancelhas(cabelo, pose, 69)
  s += boca(O, at ? 'grito' : 'aberto') + bochechas()
  // cabelo castanho com franja espetadinha e um topete
  s += forma(
    'M44 90 Q38 30 100 24 Q162 30 156 90 Q150 66 136 62 L140 48 Q126 58 116 54 L114 40 Q104 54 92 52 L84 40 Q80 56 66 60 Q52 66 44 90 Z',
    cabelo,
    O,
  )
  s += forma('M96 27 Q92 8 112 6 Q104 15 108 26 Z', cabelo, O, 3)
  s += `<path d="M62 46 Q78 32 98 30" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".25"/>`
  return s
}
