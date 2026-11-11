/**
 * Tremor: menino grandão e fofo, capacete redondo cinza-grafite com uma faixa mostarda e protetores de orelha,
 * uniforme amarelo-mostarda com calça cinza-grafite e luvas MECÂNICAS enormes (placas de metal, rebites, faixa amarela).
 * Poder: Super Impacto. Normal: soquinho de luvas na frente da barriga. Ataque: luva erguida para socar o chão.
 */
import type { Paleta } from '../../config/convite.ts'
import { boca, bochechas, cabeca, forma, membro, olhos, pernas, sk, sobrancelhas, tronco, type Pose } from './base.ts'

/** Luva mecânica gigante centrada em (cx, cy). */
function luva(cx: number, cy: number, O: string, amarelo: string, rot = 0) {
  const metal = '#A7B0BE'
  const escuro = '#6B7380'
  return (
    `<g transform="translate(${cx} ${cy}) rotate(${rot})">` +
    // punho (cano da luva)
    `<rect x="-14" y="14" width="28" height="14" rx="4" fill="${escuro}" ${sk(O, 3)}/>` +
    // mão: bloco arredondado
    `<rect x="-24" y="-20" width="48" height="38" rx="15" fill="${metal}" ${sk(O)}/>` +
    // dedos (sulcos) e polegar
    `<path d="M-12 -20 v11 M0 -20 v11 M12 -20 v11" stroke="${O}" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>` +
    `<path d="M-24 2 Q-31 -2 -28 -10 Q-24 -14 -20 -8" fill="${metal}" ${sk(O, 3)}/>` +
    // faixa amarela e rebites
    `<rect x="-22" y="2" width="44" height="6" fill="${amarelo}" stroke="${O}" stroke-width="1.6"/>` +
    `<circle cx="-15" cy="12.5" r="2.2" fill="#E5E9EF" stroke="${O}" stroke-width="1"/><circle cx="-5" cy="12.5" r="2.2" fill="#E5E9EF" stroke="${O}" stroke-width="1"/>` +
    `<circle cx="5" cy="12.5" r="2.2" fill="#E5E9EF" stroke="${O}" stroke-width="1"/><circle cx="15" cy="12.5" r="2.2" fill="#E5E9EF" stroke="${O}" stroke-width="1"/>` +
    `<path d="M-16 -14 Q-8 -17 0 -15" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".5" fill="none"/>` +
    `</g>`
  )
}

export function tremor(p: Paleta, pose: Pose) {
  const O = p.marinho
  const pele = '#C98A5E'
  const mostarda = p.mostarda
  const grafite = '#3F4652'
  const at = pose === 'ataque'
  let s = ''

  // pernas grossas grafite + botas grafite-escuras
  s += pernas(grafite, '#2B303A', O, { abertas: at, largura: 22 })

  // tronco largo mostarda, placa redonda no peito, cinto grafite com fivela mostarda
  s += tronco(mostarda, O, 37, 130, 208)
  s += `<circle cx="100" cy="164" r="15" fill="#A7B0BE" ${sk(O, 3)}/><circle cx="100" cy="164" r="7" fill="${grafite}" stroke="${O}" stroke-width="2"/>`
  s += `<circle cx="89" cy="155" r="1.8" fill="${O}"/><circle cx="111" cy="155" r="1.8" fill="${O}"/><circle cx="89" cy="173" r="1.8" fill="${O}"/><circle cx="111" cy="173" r="1.8" fill="${O}"/>`
  s += `<rect x="62" y="188" width="76" height="10" rx="3" fill="${grafite}" ${sk(O, 2.5)}/><rect x="94" y="187" width="12" height="12" rx="2" fill="${mostarda}" ${sk(O, 2)}/>`

  // braços curtos e grossos + luvas gigantes
  if (at) {
    s += membro('M64 152 Q50 172 52 188', mostarda, O, 18) + luva(52, 196, O, mostarda, 8)
    s += membro('M136 150 Q172 140 180 104', mostarda, O, 18) + luva(184, 82, O, mostarda, 14)
    // linhas de movimento
    s += `<path d="M210 60 l14 -8 M214 80 l16 0 M210 100 l14 8" stroke="${O}" stroke-width="3" stroke-linecap="round" opacity=".5"/>`
  } else {
    s += membro('M64 152 Q52 172 72 182', mostarda, O, 18)
    s += membro('M136 152 Q148 172 128 182', mostarda, O, 18)
    s += luva(78, 184, O, mostarda, 12) + luva(122, 184, O, mostarda, -12)
  }

  // cabeça com capacete redondo grafite
  s += cabeca(pele, O)
  s += olhos(O, '#B7791F')
  s += sobrancelhas(O, pose, 77)
  s += boca(O, at ? 'grito' : 'aberto') + bochechas()
  s += forma('M42 94 Q36 20 100 18 Q164 20 158 94 Q152 70 100 66 Q48 70 42 94 Z', '#4A5160', O)
  s += forma('M91 19 Q100 18 109 19 L107 66 Q100 65.5 93 66 Z', mostarda, O, 2.5)
  s += `<path d="M44 92 Q52 72 100 68 Q148 72 156 92" fill="none" stroke="#2F3540" stroke-width="5" stroke-linecap="round"/>`
  s += `<path d="M58 44 Q72 28 88 25" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".35"/>`
  // protetores de orelha
  for (const x of [41, 159]) s += `<circle cx="${x}" cy="98" r="13" fill="${grafite}" ${sk(O)}/><circle cx="${x}" cy="98" r="5" fill="${mostarda}" stroke="${O}" stroke-width="1.6"/>`
  return s
}
