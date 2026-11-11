/**
 * Vídeos curtos dos efeitos (Playwright, tela de celular 390x844).
 * Uso: node scripts/video.mjs <cena> [url] [--quadros] [--360]
 *   cenas: intro (mais as dos poderes, adicionadas na etapa da Arena)
 *   --quadros  também salva os quadros reais da tela (screencast, ~25/s) em screenshots/video/<cena>-quadros/
 *              para revisar o efeito quadro a quadro
 *   --360      grava em 360x740 no lugar de 390x844
 * Saída: screenshots/video/<cena>.webm
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const cena = args.find((a) => !a.startsWith('-') && !a.startsWith('http')) ?? 'intro'
const url = args.find((a) => a.startsWith('http')) ?? 'http://localhost:5173/'
const quadros = args.includes('--quadros')
const vp = args.includes('--360') ? { width: 360, height: 740 } : { width: 390, height: 844 }
const out = path.join('screenshots', 'video')
fs.mkdirSync(out, { recursive: true })

const cenas = {
  /** capa → toque → POW + raios + rasgo → convite */
  intro: { query: '', async run(page) {
    await page.waitForTimeout(1600)
    await page.tap('#intro')
    await page.waitForTimeout(2600)
  } },
}

const c = cenas[cena]
if (!c) throw new Error(`cena desconhecida: ${cena} (${Object.keys(cenas).join(', ')})`)

const browser = await chromium.launch()
const tmp = path.join(out, `.tmp-${cena}`)
const context = await browser.newContext({
  viewport: vp,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: 'pt-BR',
  timezoneId: 'America/Fortaleza',
  recordVideo: { dir: tmp, size: vp },
})
const page = await context.newPage()
const erros = []
page.on('pageerror', (e) => erros.push(e.message))
page.on('console', (m) => m.type() === 'error' && erros.push(m.text()))

let n = 0
let cdp
const dirQ = path.join(out, `${cena}-quadros`)
if (quadros) {
  fs.rmSync(dirQ, { recursive: true, force: true })
  fs.mkdirSync(dirQ, { recursive: true })
  cdp = await context.newCDPSession(page)
  const t0 = Date.now()
  cdp.on('Page.screencastFrame', async (f) => {
    const ms = String(Date.now() - t0).padStart(5, '0')
    fs.writeFileSync(path.join(dirQ, `${ms}.jpg`), Buffer.from(f.data, 'base64'))
    n++
    await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {})
  })
}
await page.goto(url + c.query)
if (cdp) await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, maxWidth: vp.width, maxHeight: vp.height, everyNthFrame: 1 })
await c.run(page)
if (cdp) await cdp.send('Page.stopScreencast')
const video = page.video()
await context.close()
await browser.close()
const dest = path.join(out, `${cena}${args.includes('--360') ? '-360' : ''}.webm`)
fs.renameSync(await video.path(), dest)
fs.rmSync(tmp, { recursive: true, force: true })
console.log(`${dest}${quadros ? ` · ${n} quadros em ${dirQ}` : ''}${erros.length ? `\nERROS:\n${erros.join('\n')}` : ''}`)
