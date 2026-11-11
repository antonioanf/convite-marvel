/**
 * Perfil de desempenho no celular (Playwright + Chromium, Pixel 5, CPU 4x mais lenta).
 * Uso: npm run build && npm run preview  →  npm run perf -- [url] [pasta] [rodadas]
 * (padrão: http://localhost:4173/, screenshots/desempenho, 2 rodadas; o resumo usa a mediana)
 *
 * Fases: abertura (carregar + toque na intro), scroll do convite inteiro com o dedo,
 * interações (toques, rastro, raspadinha, velinhas). Para cada fase mede as tarefas longas
 * (> 50 ms, PerformanceObserver "longtask") e o FPS médio (quadros de requestAnimationFrame).
 * Grava o trace de cada rodada (abre no DevTools → Performance → Load profile); --sem-trace só mede.
 */
import { chromium, devices } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const comTrace = !args.includes('--sem-trace') // o trace pesa bastante; --sem-trace só mede
const url = args.find((a) => a.startsWith('http')) ?? 'http://localhost:4173/'
const outDir = args.find((a) => !a.startsWith('http') && !a.startsWith('--') && !/^\d+$/.test(a)) ?? 'screenshots/desempenho'
const rodadas = +(args.find((a) => /^\d+$/.test(a)) ?? 2)
fs.mkdirSync(outDir, { recursive: true })

const { defaultBrowserType, ...pixel } = devices['Pixel 5'] // eslint-disable-line no-unused-vars
const browser = await chromium.launch()

// coleta dentro da página: tarefas longas + carimbo de cada quadro
const coletor = () => {
  const p = (window.__perf = { lt: [], frames: [] })
  try {
    new PerformanceObserver((l) => l.getEntries().forEach((e) => p.lt.push([e.startTime, e.duration]))).observe({ type: 'longtask', buffered: true })
  } catch {
    /* sem suporte */
  }
  const loop = (t) => {
    p.frames.push(t)
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)
}

async function rodada(n) {
  const context = await browser.newContext({ ...pixel, locale: 'pt-BR', timezoneId: 'America/Fortaleza' })
  const page = await context.newPage()
  await page.addInitScript(coletor)
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  const cdp = await context.newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  if (comTrace) await browser.startTracing(page, { path: path.join(outDir, `trace-${n}.json`), screenshots: false })

  const fases = []
  const t = () => page.evaluate(() => performance.now())
  const fase = async (nome, fn) => {
    const a = await t()
    await fn()
    fases.push({ nome, a, b: await t() })
  }
  const drag = async (x0, y0, x1, y1, passos = 15) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] })
    for (let i = 1; i <= passos; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + ((x1 - x0) * i) / passos, y: y0 + ((y1 - y0) * i) / passos }] })
      await page.waitForTimeout(16)
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }
  const vw = pixel.viewport.width
  const vh = pixel.viewport.height

  await fase('abertura', async () => {
    await page.goto(url, { waitUntil: 'load' })
    await page.waitForTimeout(1200)
    await page.tap('#intro')
    await page.waitForFunction(() => !document.getElementById('intro'), null, { timeout: 20000 })
    await page.waitForTimeout(2500)
  })

  await fase('scroll', async () => {
    for (let i = 0; i < 60; i++) {
      await drag(vw / 2 + 40, vh * 0.78, vw / 2 + 40, vh * 0.22)
      await page.waitForTimeout(120)
      const fim = await page.evaluate(() => window.scrollY + innerHeight >= document.documentElement.scrollHeight - 4)
      if (fim) break
    }
    await page.waitForTimeout(800)
  })

  await fase('interacoes', async () => {
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(800)
    for (let i = 0; i < 5; i++) {
      await page.touchscreen.tap(40 + i * 60, vh * 0.86)
      await page.waitForTimeout(250)
    }
    for (let i = 0; i < 3; i++) await drag(30, vh * 0.3 + i * 60, vw - 30, vh * 0.5 + i * 40, 20) // rastro de brilho
    await page.evaluate(() => document.querySelector('#local .scratch')?.scrollIntoView({ block: 'center' }))
    await page.waitForTimeout(900)
    const box = await page.locator('#local .scratch canvas').boundingBox().catch(() => null)
    if (box) for (let i = 0; i < 4; i++) await drag(box.x + 10, box.y + 12 + i * 18, box.x + box.width - 10, box.y + 20 + i * 18, 18)
    await page.evaluate(() => document.getElementById('velinhas')?.scrollIntoView({ block: 'center' }))
    await page.waitForTimeout(900)
    const vel = await page.locator('#velinhas .candles-hit').boundingBox().catch(() => null)
    if (vel) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: vel.x + vel.width / 2, y: vel.y + vel.height / 2 }] })
      await page.waitForTimeout(1800)
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    }
    await page.waitForTimeout(1500)
  })

  const dados = await page.evaluate(() => window.__perf)
  if (comTrace) await browser.stopTracing()
  await context.close()

  return fases.map(({ nome, a, b }) => {
    const lt = dados.lt.filter(([s]) => s >= a && s < b)
    const fr = dados.frames.filter((f) => f >= a && f < b)
    const gaps = fr.slice(1).map((f, i) => f - fr[i])
    return {
      fase: nome,
      segundos: +((b - a) / 1000).toFixed(1),
      tarefasLongas: lt.length,
      msBloqueado: Math.round(lt.reduce((s, [, d]) => s + Math.max(0, d - 50), 0)),
      maiorTarefa: Math.round(Math.max(0, ...lt.map(([, d]) => d))),
      fpsMedio: +((fr.length - 1) / ((fr.at(-1) - fr[0]) / 1000)).toFixed(1),
      quadrosLentos: gaps.filter((g) => g > 50).length,
      erros: errors.length,
    }
  })
}

const todas = []
for (let n = 1; n <= rodadas; n++) {
  const r = await rodada(n)
  todas.push(r)
  console.log(`\nRodada ${n}`)
  console.table(r)
}
await browser.close()
fs.writeFileSync(path.join(outDir, 'resultado.json'), JSON.stringify(todas, null, 2))

// mediana das rodadas (uma rodada atrapalhada pelo computador não distorce o resultado)
const mediana = (xs) => {
  const v = [...xs].sort((a, b) => a - b)
  const m = v.length >> 1
  return +(v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2).toFixed(1)
}
const resumo = todas[0].map((f, i) => {
  const m = (k) => mediana(todas.map((r) => r[i][k]))
  return { fase: f.fase, tarefasLongas: m('tarefasLongas'), msBloqueado: m('msBloqueado'), maiorTarefa: m('maiorTarefa'), fpsMedio: m('fpsMedio'), quadrosLentos: m('quadrosLentos') }
})
console.log(`
Mediana de ${todas.length} rodadas`)
console.table(resumo)
fs.writeFileSync(path.join(outDir, 'resumo.json'), JSON.stringify(resumo, null, 2))
