/**
 * Prints do hero e das seções de informação em dois aparelhos (iPhone 13 e 360x740), para comparar
 * antes/depois. Uso: node scripts/comparar.mjs <rótulo> [url]  →  screenshots/<rótulo>/<aparelho>-<seção>.png
 * (Chromium com o tamanho, a densidade de pixels e o toque de cada aparelho.)
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const rotulo = process.argv[2] ?? 'depois'
const url = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:5173/'
const pasta = `screenshots/${rotulo}`
mkdirSync(pasta, { recursive: true })
const aparelhos = {
  'iphone13': { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 },
  '360x740': { viewport: { width: 360, height: 740 }, deviceScaleFactor: 2 },
}
const b = await chromium.launch()
for (const [nome, ap] of Object.entries(aparelhos)) {
  const ctx = await b.newContext({ ...ap, isMobile: true, hasTouch: true, locale: 'pt-BR' })
  const p = await ctx.newPage()
  await p.goto(url + '?abrir=1&modo=normal', { waitUntil: 'load' })
  await p.waitForTimeout(3500) // céu pintado, título aceso
  await p.screenshot({ path: `${pasta}/${nome}-1-hero.png` })
  for (const [i, id] of ['contagem', 'missao', 'confirmar'].entries()) {
    await p.evaluate((id) => document.getElementById(id)?.scrollIntoView({ block: 'start' }), id)
    await p.waitForTimeout(1600)
    await p.screenshot({ path: `${pasta}/${nome}-${i + 2}-${id}.png` })
  }
  // o cartão do local (embaixo da seção missão)
  await p.evaluate(() => document.querySelector('#missao .cartao:nth-of-type(2)')?.scrollIntoView({ block: 'center' }))
  await p.waitForTimeout(1200)
  await p.screenshot({ path: `${pasta}/${nome}-3b-local.png` })
  await ctx.close()
}
await b.close()
console.log('prints em', pasta)
