/**
 * Medição de desempenho do hero (Chromium, Pixel 5, CPU 4x mais lenta).
 * Uso: npm run build && npx vite preview  (outro terminal)  →  node scripts/perf-hero.mjs [url] [--leve]
 * Mede três fases: abertura (toque → 2 s), hero parado (6 s, com relâmpagos, brasas e eletricidade)
 * e rolagem (scroll com o dedo). Para cada uma: FPS médio, quadros lentos (> 50 ms) e tarefas longas.
 */
import { chromium, devices } from 'playwright'
import { mkdirSync } from 'node:fs'

const url = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:4173/'
const leve = process.argv.includes('--leve')
const { defaultBrowserType, ...pixel } = devices['Pixel 5'] // eslint-disable-line no-unused-vars
const browser = await chromium.launch()
const ctx = await browser.newContext({ ...pixel, locale: 'pt-BR' })
const page = await ctx.newPage()
const cdp = await ctx.newCDPSession(page)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })

await page.addInitScript(() => {
  window.__lt = []
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push({ t: e.startTime, d: e.duration }))).observe({ type: 'longtask', buffered: true })
  window.__fr = []
  const f = (t) => {
    window.__fr.push(t)
    requestAnimationFrame(f)
  }
  requestAnimationFrame(f)
})
await page.goto(url + (leve ? '?modo=leve' : '?modo=normal'), { waitUntil: 'load' })
await page.waitForTimeout(1500)

const medir = async (nome, acao) => {
  const t0 = await page.evaluate(() => performance.now())
  await acao()
  const t1 = await page.evaluate(() => performance.now())
  const r = await page.evaluate(
    ([a, b]) => {
      const fr = window.__fr.filter((t) => t >= a && t <= b)
      const dts = fr.slice(1).map((t, i) => t - fr[i])
      const lt = window.__lt.filter((e) => e.t >= a && e.t <= b)
      return {
        fps: +((fr.length - 1) / ((b - a) / 1000)).toFixed(1),
        quadrosLentos: dts.filter((d) => d > 50).length,
        tarefasLongas: lt.length,
        bloqueadoMs: Math.round(lt.reduce((s, e) => s + Math.max(0, e.d - 50), 0)),
        maiorTarefaMs: Math.round(Math.max(0, ...lt.map((e) => e.d))),
      }
    },
    [t0, t1],
  )
  console.log(nome.padEnd(14), JSON.stringify(r))
}

await medir('abertura', async () => {
  await page.tap('#intro')
  await page.waitForTimeout(2000)
})
mkdirSync('screenshots/desempenho', { recursive: true })
await browser.startTracing(page, { path: `screenshots/desempenho/hero${leve ? '-leve' : ''}.json`, screenshots: false })
await medir('hero parado', () => page.waitForTimeout(6000))
await browser.stopTracing()
await medir('rolagem', async () => {
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 260)
    await page.waitForTimeout(250)
  }
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, -260)
    await page.waitForTimeout(250)
  }
})
await browser.close()
