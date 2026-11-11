/**
 * Qual camada do hero pesa mais? Mede o FPS do hero parado (6 s, Pixel 5, CPU 4x mais lenta)
 * desligando uma camada de cada vez (CSS injetado). Uso: build + preview → node scripts/perf-camadas.mjs [url] [--leve]
 */
import { chromium, devices } from 'playwright'

const url = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:4173/'
const leve = process.argv.includes('--leve')
const { defaultBrowserType, ...pixel } = devices['Pixel 5'] // eslint-disable-line no-unused-vars
const variantes = {
  tudo: '',
  'sem raios de sol': '.raios-sol{display:none!important}',
  'sem nuvens perto': '.nuvens{display:none!important}',
  'céu parado': '.ceu{animation:none!important}',
  'sem grão': '.grao{display:none!important}',
  'sem atmosfera': '.atmosfera{display:none!important}',
  'sem eletricidade/reflexo título': '.titulo-arcos{display:none!important}',
  'sem aura/reflexo selo': '.selo-aura,.selo-reflexo{display:none!important}',
  'sem nada': '.cena>*:not(.ceu),.grao,.titulo-arcos,.selo-aura,.selo-reflexo{display:none!important}.ceu{animation:none!important}',
}
const browser = await chromium.launch()
for (const [nome, css] of Object.entries(variantes)) {
  const ctx = await browser.newContext({ ...pixel, locale: 'pt-BR' })
  const page = await ctx.newPage()
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  await page.addInitScript(() => {
    window.__fr = []
    const f = (t) => (window.__fr.push(t), requestAnimationFrame(f))
    requestAnimationFrame(f)
  })
  await page.goto(url + (leve ? '?modo=leve&abrir=1' : '?modo=normal&abrir=1'), { waitUntil: 'load' })
  if (css) await page.addStyleTag({ content: css })
  await page.waitForTimeout(3000)
  const a = await page.evaluate(() => performance.now())
  await page.waitForTimeout(6000)
  const fps = await page.evaluate((a) => {
    const fr = window.__fr.filter((t) => t >= a)
    return +((fr.length - 1) / ((fr[fr.length - 1] - fr[0]) / 1000)).toFixed(1)
  }, a)
  console.log(nome.padEnd(34), fps, 'fps')
  await ctx.close()
}
await browser.close()
