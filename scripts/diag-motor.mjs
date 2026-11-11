/** Diagnóstico: tempo de quadro de cada poder (sem prints). node scripts/diag-motor.mjs [url] [--2d] */
import { chromium, devices } from 'playwright'
const url = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:5173/'
const d2 = process.argv.includes('--2d')
const { defaultBrowserType, ...pixel } = devices['Pixel 5'] // eslint-disable-line no-unused-vars
const b = await chromium.launch({ args: process.argv.includes('--gpu') ? ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-webgpu'] : [] })
const p = await (await b.newContext({ ...pixel })).newPage()
p.on('console', (m) => console.log('  [console]', m.text().slice(0, 160)))
p.on('pageerror', (e) => console.log('  [erro]', String(e).slice(0, 200)))
await p.goto(`${url}?abrir=1&modo=normal&teste=1${d2 ? '&motor=2d' : ''}`, { waitUntil: 'load' })
await p.waitForTimeout(2000)
// como no uso real: o motor baixa perto da seção e aquece antes do primeiro poder
await p.evaluate(() => window.__convite.carregarMotor())
await p.waitForTimeout(4000)
for (const id of ['impacto', 'tempestade', 'rajada', 'magia', 'portal', 'cosmico']) {
  const r = await p.evaluate(async (id) => {
    const ts = []
    let on = true
    const f = (t) => (ts.push(t), on && requestAnimationFrame(f))
    requestAnimationFrame(f)
    const t0 = performance.now()
    await window.__convite.acionar.demo(id)
    on = false
    const dts = ts.slice(1).map((t, i) => t - ts[i])
    return { ms: Math.round(performance.now() - t0), quadros: ts.length, medio: Math.round(dts.reduce((a, b) => a + b, 0) / dts.length), pior: Math.round(Math.max(...dts)) }
  }, id)
  console.log(id.padEnd(11), JSON.stringify(r))
}
await b.close()
