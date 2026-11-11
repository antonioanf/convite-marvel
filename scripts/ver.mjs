/**
 * Prints rápidos do convite (Chromium, Pixel 5): abertura, hero e cada seção.
 * Uso: npm run dev  (outro terminal)  →  node scripts/ver.mjs [url] [pasta]
 */
import { chromium, devices } from 'playwright'
import { mkdirSync } from 'node:fs'

const url = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:5173/'
const pasta = process.argv.find((a, i) => i > 1 && !a.startsWith('http')) ?? 'screenshots/ver'
mkdirSync(pasta, { recursive: true })
const { defaultBrowserType, ...pixel } = devices['Pixel 5'] // eslint-disable-line no-unused-vars
const b = await chromium.launch()
const p = await (await b.newContext({ ...pixel, locale: 'pt-BR' })).newPage()
const erros = []
p.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && erros.push(m.text()))
p.on('pageerror', (e) => erros.push(String(e)))
await p.goto(url + (url.includes('?') ? '&' : '?') + 'modo=normal&teste=1', { waitUntil: 'load' })
await p.waitForTimeout(1500)
await p.screenshot({ path: `${pasta}/0-abertura.png` })
await p.tap('#intro')
await p.waitForTimeout(250)
await p.screenshot({ path: `${pasta}/1-luz.png` })
await p.waitForTimeout(2600)
await p.screenshot({ path: `${pasta}/2-hero.png` })
for (const id of ['contagem', 'missao', 'poderes', 'confirmar']) {
  await p.evaluate((id) => document.getElementById(id)?.scrollIntoView({ block: 'start' }), id)
  await p.waitForTimeout(1800)
  await p.screenshot({ path: `${pasta}/3-${id}.png` })
}
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await p.waitForTimeout(1500)
await p.screenshot({ path: `${pasta}/4-rodape.png` })
console.log('erros/avisos:', erros.length ? erros : 'nenhum')
await b.close()
