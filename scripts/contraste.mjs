/**
 * Contraste dos textos que ficam SOBRE O CÉU (fora dos cartões), no pior caso:
 * para cada texto, esconde as letras, fotografa o fundo atrás e usa o pixel mais claro
 * (texto claro) contra a cor do texto. Mede com o texto no alto, no meio e embaixo da tela,
 * porque o céu é fixo e o conteúdo rola por cima dele.
 * Uso: npm run dev  →  node scripts/contraste.mjs [url]
 */
import { chromium, devices } from 'playwright'
import sharp from 'sharp'

const url = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:5173/'
const { defaultBrowserType, ...pixel } = devices['Pixel 5'] // eslint-disable-line no-unused-vars
const b = await chromium.launch()
const p = await (await b.newContext({ ...pixel, locale: 'pt-BR', reducedMotion: 'reduce' })).newPage()
await p.goto(url + '?abrir=1&modo=normal', { waitUntil: 'load' })
await p.waitForTimeout(2500) // céu pintado
// a barra de progresso e a barra de baixo (fixas) não são fundo do texto
await p.addStyleTag({ content: '.progress, .fixed, .fx-2d, .grao { display: none !important }' })

const lum = ([r, g, bb]) => {
  const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bb)
}
const razao = (a, c) => {
  const [x, y] = [lum(a), lum(c)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

// textos sobre o céu: hero e cabeçalhos de seção (rótulos e índices), rodapé
const sel = ['#inicio p', '.secao-titulo p', '.secao-titulo span.mono', '.rodape-txt p:not(.display)']
const alvos = await p.evaluate((sel) => {
  const out = []
  document.querySelectorAll(sel.join(',')).forEach((el, i) => {
    if (!el.textContent.trim() || el.closest('.cartao')) return
    el.setAttribute('data-ct', String(i))
    const c = getComputedStyle(el).color.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number)
    out.push({ i, txt: el.textContent.trim().slice(0, 34), cor: c, grande: parseFloat(getComputedStyle(el).fontSize) >= 24 })
  })
  return out
}, sel)

let piores = []
for (const a of alvos) {
  let pior = Infinity
  for (const pos of ['start', 'center', 'end']) {
    const box = await p.evaluate(
      ([i, pos]) => {
        const el = document.querySelector(`[data-ct="${i}"]`)
        el.scrollIntoView({ block: pos })
        // o hero só existe no alto da página: não dá para rolá-lo até o meio/fundo
        el.style.visibility = 'hidden'
        const r = el.getBoundingClientRect()
        return { x: Math.max(0, r.left), y: Math.max(0, r.top), w: Math.min(innerWidth, r.right) - Math.max(0, r.left), h: Math.min(innerHeight, r.bottom) - Math.max(0, r.top) }
      },
      [a.i, pos],
    )
    await p.waitForTimeout(120)
    if (box.w < 2 || box.h < 2) continue
    const png = await p.screenshot({ clip: { x: box.x, y: box.y, width: box.w, height: box.h } })
    await p.evaluate((i) => (document.querySelector(`[data-ct="${i}"]`).style.visibility = ''), a.i)
    const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true })
    // percentil 98 da luminância (ignora pontinhos isolados de poeira/brasa)
    const ls = []
    for (let k = 0; k < data.length; k += info.channels) ls.push([data[k], data[k + 1], data[k + 2]])
    ls.sort((m, n) => lum(m) - lum(n))
    const claro = ls[Math.floor(ls.length * 0.98)]
    pior = Math.min(pior, razao(a.cor, claro))
  }
  const min = a.grande ? 3 : 4.5
  piores.push({ texto: a.txt, contraste: +pior.toFixed(2), minimo: min, ok: pior >= min })
}
console.table(piores)
console.log(piores.every((x) => x.ok) ? 'TUDO AA' : 'ABAIXO DE AA: ' + piores.filter((x) => !x.ok).length)
await b.close()
