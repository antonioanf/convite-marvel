/**
 * Rochas escuras em primeiro plano (SVG gerado por código, sempre igual para a mesma semente):
 * duas fileiras de pedras irregulares; a de trás mais clara (névoa), a da frente quase preta.
 * A borda de cima de cada pedra pega a luz do céu (contraluz quente): a pedra é pintada primeiro na
 * cor da luz e depois de novo, escura, 2 px mais abaixo — sobra só um filete aceso no contorno.
 */
import { seeded } from '../rnd'

function pedras(rnd: () => number, base: number, alt: [number, number], larg: [number, number]) {
  let d = ''
  for (let x = -30; x < 430; ) {
    const w = larg[0] + rnd() * (larg[1] - larg[0])
    const h = alt[0] + rnd() * (alt[1] - alt[0])
    // contorno quebrado: 5 a 7 vértices no topo da pedra
    const n = 5 + ((rnd() * 3) | 0)
    d += `M${x.toFixed(1)} ${base}`
    for (let k = 0; k <= n; k++) {
      const t = k / n
      const curva = Math.sin(t * Math.PI) // mais alta no meio
      const y = base - h * (0.25 + 0.75 * curva) * (0.8 + rnd() * 0.35)
      d += `L${(x + w * t + (rnd() - 0.5) * w * 0.12).toFixed(1)} ${y.toFixed(1)}`
    }
    d += `L${(x + w).toFixed(1)} ${base}Z`
    x += w * (0.55 + rnd() * 0.3)
  }
  return d
}

export function rochasSvg(seed = 3) {
  const rnd = seeded(seed * 131 + 7)
  const tras = pedras(rnd, 120, [58, 100], [70, 130])
  const frente = pedras(rnd, 120, [30, 66], [80, 160])
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">` +
    `<defs><linearGradient id="rk-luz" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3A6BFF"/><stop offset=".35" stop-color="#FF8A2A"/><stop offset=".5" stop-color="#FFD27A"/><stop offset=".65" stop-color="#FF8A2A"/><stop offset="1" stop-color="#3A6BFF"/></linearGradient>` +
    `<linearGradient id="rk-t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1C2036"/><stop offset=".6" stop-color="#0C0F1C"/><stop offset="1" stop-color="#07090F"/></linearGradient>` +
    `<linearGradient id="rk-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B0D17"/><stop offset="1" stop-color="#05070D"/></linearGradient></defs>` +
    `<path d="${tras}" fill="url(#rk-luz)" opacity=".55"/>` +
    `<path d="${tras}" fill="url(#rk-t)" transform="translate(0 1.6)"/>` +
    `<path d="${frente}" fill="url(#rk-luz)" opacity=".8"/>` +
    `<path d="${frente}" fill="url(#rk-f)" transform="translate(0 1.8)"/>` +
    `<rect x="0" y="118" width="400" height="4" fill="#05070D"/>` +
    `</svg>`
  )
}
