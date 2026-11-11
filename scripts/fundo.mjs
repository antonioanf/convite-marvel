/**
 * Prints da imagem de fundo das seções: transição hero → imagem e duas seções com a imagem atrás,
 * no iPhone 13 e no 360x740. Também confere que a imagem NÃO baixa antes de rolar.
 * Uso: node scripts/fundo.mjs [url]  →  screenshots/fundo/
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const url = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:5173/'
mkdirSync('screenshots/fundo', { recursive: true })
const aparelhos = {
  iphone13: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 },
  '360x740': { viewport: { width: 360, height: 740 }, deviceScaleFactor: 2 },
}
const b = await chromium.launch()
for (const [nome, ap] of Object.entries(aparelhos)) {
  const ctx = await b.newContext({ ...ap, isMobile: true, hasTouch: true, locale: 'pt-BR' })
  const p = await ctx.newPage()
  const pedidos = []
  p.on('request', (r) => r.url().includes('/fotos/fundo') && pedidos.push(r.url().split('/').pop()))
  await p.goto(url + '?abrir=1&modo=normal', { waitUntil: 'load' })
  await p.waitForTimeout(3000)
  console.log(nome, '· imagem baixada antes de rolar?', pedidos.length ? `SIM (${pedidos})` : 'não')
  // transição: o fim do hero no meio da tela
  await p.evaluate(() => {
    const t = document.querySelector('.transicao-fundo')
    window.scrollTo(0, t.getBoundingClientRect().top + scrollY - innerHeight * 0.45)
  })
  await p.waitForFunction(() => document.querySelector('.fundo-secoes img')?.classList.contains('pronta'), null, { timeout: 15000 })
  await p.waitForTimeout(1200)
  console.log(nome, '· baixou ao rolar:', pedidos.join(', '))
  await p.screenshot({ path: `screenshots/fundo/${nome}-1-transicao.png` })
  for (const [i, id] of ['missao', 'poderes'].entries()) {
    await p.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'start' }), id)
    await p.waitForTimeout(1500)
    await p.screenshot({ path: `screenshots/fundo/${nome}-${i + 2}-${id}.png` })
  }
  await ctx.close()
}
await b.close()
