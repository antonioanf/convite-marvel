/**
 * Astra: menina de cabelo longo azul-escuro salpicado de estrelinhas, tiara dourada com três cristais,
 * capa longa lilás com constelações, roupa branca com gola lilás, estrela dourada no cinto, botas lilás.
 * Poder: Portal Mágico. Normal: segura uma estrelinha. Ataque: braços abertos, capa aberta, estrela brilhando no alto.
 */
import type { Paleta } from '../../config/convite.ts'
import { boca, bochechas, cabeca, estrela, forma, mao, membro, olhos, orelhas, pernas, sk, sobrancelhas, tronco, type Pose } from './base.ts'

export function astra(p: Paleta, pose: Pose) {
  const O = p.marinho
  const pele = '#8D5A3B'
  const cabelo = '#1E2A78'
  const lilas = p.lilas
  const branco = '#FBF8FF'
  const at = pose === 'ataque'
  let s = ''

  // capa longa lilás com constelações (atrás)
  const capa = at ? 'M72 140 Q100 130 128 140 L178 212 Q100 248 22 212 Z' : 'M72 140 Q100 130 128 140 L150 232 Q100 246 50 232 Z'
  const pts = at
    ? [[50, 196], [66, 178], [80, 204], [140, 180], [156, 202], [126, 214]]
    : [[64, 214], [74, 194], [86, 222], [126, 198], [136, 222], [116, 214]]
  s += `<g class="h-capa">${forma(capa, lilas, O)}`
  s += `<path d="M${pts[0]} L${pts[1]} L${pts[2]} M${pts[3]} L${pts[4]} L${pts[5]}" fill="none" stroke="#fff" stroke-width="1.4" opacity=".7"/>`
  s += pts.map(([x, y]) => estrela(x, y, 4, '#fff')).join('') + '</g>'

  // cabelo comprido (parte de trás)
  s += forma('M40 94 Q30 26 100 22 Q170 26 160 94 Q170 146 152 178 Q140 158 140 128 L60 128 Q60 158 48 178 Q30 146 40 94 Z', cabelo, O)

  // pernas lilás + botas lilás-escuras
  s += pernas('#9F7AEA', '#6D4FC2', O, { abertas: at })

  // roupa branca, gola lilás, cinto dourado com estrela
  s += tronco(branco, O)
  s += `<path d="M80 134 Q100 152 120 134" fill="${lilas}" ${sk(O, 2.5)}/>`
  s += `<rect x="70" y="186" width="60" height="8" rx="3" fill="${p.dourado}" ${sk(O, 2.2)}/>`
  s += estrela(100, 190, 9, p.amarelo, sk(O, 1.8))

  // braços (mangas brancas, luvas lilás)
  if (at) {
    s += membro('M76 148 Q36 142 26 108', branco, O) + mao(22, 98, lilas, O, 10)
    s += membro('M124 148 Q164 142 174 108', branco, O) + mao(178, 98, lilas, O, 10)
    s += `<g class="h-brilho"><circle cx="100" cy="-4" r="22" fill="${lilas}" opacity=".35"/>${estrela(100, -4, 22, p.amarelo)}${estrela(100, -4, 9, '#fff')}`
    s += `${estrela(10, 80, 9, '#fff')}${estrela(190, 80, 9, '#fff')}${estrela(8, 116, 5, p.amarelo)}${estrela(192, 116, 5, p.amarelo)}</g>`
  } else {
    s += membro('M76 150 Q70 172 90 172', branco, O) + mao(93, 171, lilas, O, 9.5)
    s += membro('M124 150 Q130 172 110 172', branco, O) + mao(107, 171, lilas, O, 9.5)
    s += `<g class="h-brilho"><circle cx="100" cy="158" r="13" fill="${p.amarelo}" opacity=".3"/>${estrela(100, 158, 11, p.amarelo, sk(O, 1.8))}</g>`
  }

  // cabeça
  s += orelhas(pele, O) + cabeca(pele, O)
  s += olhos(O, '#9F7AEA')
  s += sobrancelhas(cabelo, pose, 76)
  s += boca(O, at ? 'grito' : 'aberto') + bochechas('#FF7A93')
  // franja
  s += forma('M44 94 Q42 32 100 26 Q158 32 156 94 Q146 60 122 56 Q110 70 100 58 Q90 70 78 56 Q54 60 44 94 Z', cabelo, O)
  // estrelinhas no cabelo
  s += estrela(66, 46, 4.5, '#fff') + estrela(136, 48, 4, p.amarelo) + estrela(52, 140, 4, '#fff') + estrela(150, 150, 4.5, p.amarelo) + estrela(146, 84, 3, '#fff')
  // tiara dourada com três cristais
  s += `<path d="M58 52 Q100 30 142 52" fill="none" stroke="${p.dourado}" stroke-width="5.5" stroke-linecap="round"/>`
  s += `<path d="M58 52 Q100 30 142 52" fill="none" stroke="${O}" stroke-width="1.2" opacity=".5"/>`
  const cristal = (x: number, y: number, r: number) => `<path d="M${x} ${y - r * 1.5} L${x + r} ${y} L${x} ${y + r * 0.9} L${x - r} ${y} Z" fill="#DDF4FF" ${sk(O, 2)}/>`
  s += cristal(81, 42, 5) + cristal(119, 42, 5) + cristal(100, 34, 7.5)
  s += `<path d="M98 26 l2 -2" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`
  return s
}
