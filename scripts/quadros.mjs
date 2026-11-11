/**
 * Revisão quadro a quadro dos poderes: dispara cada poder pelo botão (ou gesto sintético) e grava
 * uma sequência de prints em screenshots/quadros/<poder>-NN.png.
 * Uso: npm run dev  →  node scripts/quadros.mjs [url] [poder...] [--2d] [--gestos]
 *   --2d      força o fallback em canvas 2D (?motor=2d)
 *   --gestos  usa os gestos de toque de verdade (CDP) em vez dos botões
 */
import { chromium, devices } from 'playwright'
import { mkdirSync } from 'node:fs'

const args = process.argv.slice(2)
const url = args.find((a) => a.startsWith('http')) ?? 'http://localhost:5173/'
const d2 = args.includes('--2d')
const gestos = args.includes('--gestos')
const todos = ['tempestade', 'impacto', 'rajada', 'magia', 'portal', 'cosmico']
const lista = args.filter((a) => todos.includes(a))
const poderes = lista.length ? lista : todos
const pasta = `screenshots/quadros${d2 ? '-2d' : ''}`
mkdirSync(pasta, { recursive: true })

const { defaultBrowserType, ...pixel } = devices['Pixel 5'] // eslint-disable-line no-unused-vars
const b = await chromium.launch({ args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const ctx = await b.newContext({ ...pixel, locale: 'pt-BR' })
const p = await ctx.newPage()
const cdp = await ctx.newCDPSession(p)
const erros = []
p.on('pageerror', (e) => erros.push(String(e)))
p.on('console', (m) => m.type() === 'error' && erros.push(m.text()))
p.on('console', (m) => m.text().includes('[convite]') && console.log('  ', m.text()))
await p.goto(`${url}?abrir=1&modo=normal&teste=1${d2 ? '&motor=2d' : ''}`, { waitUntil: 'load' })
await p.waitForTimeout(2500)
// rola até um ponto neutro (a seção de contagem), longe dos botões
await p.evaluate(() => document.getElementById('contagem')?.scrollIntoView({ block: 'start' }))
await p.evaluate(() => window.__convite.acionar.demo('impacto').then(() => 0)) // aquece o motor (compila)
await p.waitForTimeout(2500)

const W = pixel.viewport.width
const H = pixel.viewport.height
// `ts` (segundos desde 1970) = hora do toque, como num dedo real (o convite mede a velocidade por ela)
const toque = (type, pts, ts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], id) => ({ x, y, id })), ...(ts ? { timestamp: ts } : {}) })
const espera = (ms) => new Promise((r) => setTimeout(r, ms))

async function gesto(id) {
  if (id === 'tempestade') {
    const t0 = Date.now() / 1000
    await toque('touchStart', [[W / 2, 90]], t0)
    for (let i = 1; i <= 4; i++) await toque('touchMove', [[W / 2 + i, 90 + i * 80]], t0 + i * 0.03) // arrasto rápido de ~0,15 s
    await toque('touchEnd', [], t0 + 0.15)
  } else if (id === 'impacto') {
    for (let k = 0; k < 2; k++) (await toque('touchStart', [[W / 2, H * 0.55]]), await espera(60), await toque('touchEnd', []), await espera(120))
  } else if (id === 'rajada') {
    await toque('touchStart', [[W * 0.55, H * 0.6]])
    await espera(1500)
    await toque('touchEnd', [])
  } else if (id === 'magia' || id === 'portal') {
    const voltas = id === 'magia' ? 2.6 : 1.05
    const n = Math.round(36 * voltas)
    const c = [W / 2, H * 0.48]
    // começa na horizontal (assim a rolagem nativa não pega o gesto)
    await toque('touchStart', [[c[0] + 90, c[1]]])
    for (let i = 1; i <= n; i++) {
      const a = (i / 36) * Math.PI * 2
      await toque('touchMove', [[c[0] + Math.cos(a) * 90, c[1] + Math.sin(a) * 90]])
      await espera(16)
    }
    await toque('touchEnd', [])
  } else if (id === 'cosmico') {
    await toque('touchStart', [[W / 2 - 20, H * 0.5], [W / 2 + 20, H * 0.5]])
    await espera(1800)
    await toque('touchEnd', [])
  }
}

for (const id of poderes) {
  const t0 = Date.now()
  let pr = Promise.resolve()
  if (gestos) pr = gesto(id)
  else void p.evaluate((id) => window.__convite.acionar.demo(id), id)
  // ~4 quadros por segundo durante 3,2 s
  for (let k = 0; k < 13; k++) {
    const alvo = t0 + 120 + k * 250
    const falta = alvo - Date.now()
    if (falta > 0) await espera(falta)
    await p.screenshot({ path: `${pasta}/${id}-${String(k).padStart(2, '0')}.png` })
  }
  await pr // o próximo gesto só começa quando este terminou
  console.log(id.padEnd(11), (await p.evaluate((id) => window.__convite.poderes.tem(id), id)) ? "ativado" : "NÃO ATIVOU")
  await espera(2400)
}
console.log('poderes ativados:', await p.evaluate(() => window.__convite.poderes.total()))
console.log('erros:', erros.length ? erros : 'nenhum')
await b.close()
