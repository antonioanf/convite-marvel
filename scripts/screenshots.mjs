/**
 * Testes visuais no celular (Playwright).
 * Uso: npm run shots -- [url] [pasta] [--video] [--only=iphone13,pixel5] [--query=modo=3d]
 *
 * Para cada aparelho: screenshot da intro, abre o convite com um toque,
 * fotografa cada seção, confere scroll horizontal e erros no console.
 */
import { chromium, webkit, devices } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const url = args.find((a) => a.startsWith('http')) ?? 'http://localhost:5173/'
const outDir = args.find((a) => !a.startsWith('http') && !a.startsWith('--')) ?? 'screenshots/atual'
const video = args.includes('--video')
const only = args.find((a) => a.startsWith('--only='))?.slice(7).split(',')
const query = args.find((a) => a.startsWith('--query='))?.slice(8)
const sections = (args.find((a) => a.startsWith('--sections='))?.slice(11) ?? 'inicio,tres,contagem,local,galeria,velinhas,confirmar,presentes,footer').split(',')

const strip = ({ defaultBrowserType, ...d }) => d // eslint-disable-line no-unused-vars
const targets = [
  { name: 'iphone13', browser: webkit, ctx: strip(devices['iPhone 13']) },
  { name: 'pixel5', browser: chromium, ctx: strip(devices['Pixel 5']) },
  { name: 'android360', browser: chromium, ctx: { ...strip(devices['Pixel 5']), viewport: { width: 360, height: 740 }, screen: { width: 360, height: 740 } } },
  { name: 'iphone-promax', browser: webkit, ctx: { ...strip(devices['iPhone 13 Pro Max'] ?? devices['iPhone 13']), viewport: { width: 430, height: 932 }, screen: { width: 430, height: 932 } } },
].filter((t) => !only || only.includes(t.name))

fs.mkdirSync(outDir, { recursive: true })
const report = []

for (const t of targets) {
  const browser = await t.browser.launch()
  const context = await browser.newContext({
    ...t.ctx,
    locale: 'pt-BR',
    timezoneId: 'America/Fortaleza',
    ...(video ? { recordVideo: { dir: path.join(outDir, 'video', t.name), size: t.ctx.viewport } } : {}),
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`)
    if (m.text().includes('[convite]')) errors.push(`info: ${m.text()}`)
  })
  const u = query ? `${url}${url.includes('?') ? '&' : '?'}${query}` : url
  const t0 = Date.now()
  await page.goto(u, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#intro', { timeout: 5000 })
  const introMs = Date.now() - t0
  await page.waitForTimeout(900)
  await page.screenshot({ path: path.join(outDir, `${t.name}-0-intro.png`) })
  await page.tap('#intro')
  await page.waitForTimeout(700)
  await page.screenshot({ path: path.join(outDir, `${t.name}-1-abrindo.png`) })
  await page.waitForTimeout(2600)
  await page.screenshot({ path: path.join(outDir, `${t.name}-2-hero.png`) })

  let i = 3
  for (const id of sections.slice(1)) {
    const ok = await page.evaluate((id) => {
      const el = id === 'footer' ? document.querySelector('footer') : document.getElementById(id)
      if (!el) return false
      const y = el.getBoundingClientRect().top + window.scrollY - 20
      window.scrollTo(0, y)
      return true
    }, id)
    if (!ok) continue
    await page.waitForTimeout(1800)
    await page.screenshot({ path: path.join(outDir, `${t.name}-${i++}-${id}.png`) })
  }

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    lite: document.documentElement.classList.contains('lite'),
    canvas3d: !!document.querySelector('canvas[data-engine]'),
  }))
  report.push({ device: t.name, introMs, ...overflow, horizontalScroll: overflow.scrollWidth > overflow.innerWidth, errors })
  await context.close()
  await browser.close()
}

console.log(JSON.stringify(report, null, 2))
