/**
 * Gera public/og.jpg (1200x630, prévia do link no WhatsApp) e public/apple-touch-icon.png
 * a partir do src/config/convite.ts. Uso: npm run og
 *
 * Visual de pôster de cinema: noite de tempestade, um raio, o emblema JL em metal e o título.
 * O quadrado central (x 285–915) funciona sozinho na miniatura pequena do WhatsApp.
 * Também salva screenshots/og-miniatura.png (como fica em ~96 px) para conferir a leitura.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { convite } from '../src/config/convite.ts'
import { temaCss } from '../src/config/tema.ts'
import { emblemaSvg } from '../src/lib/emblema.ts'
import { cidadeSvg } from '../src/lib/cidade.ts'
import { gerarRaio } from '../src/lib/fx/raio.ts'
import { seeded } from '../src/lib/rnd.ts'

const root = path.resolve(import.meta.dirname, '..')
const font = (f) => `data:font/woff2;base64,${fs.readFileSync(path.join(root, 'public/fonts', f)).toString('base64')}`
const p = convite.paleta
const c = convite.crianca
const tz = convite.festa.fusoHorario
const data = new Date(convite.festa.dataHora)
const fmt = (o) => new Intl.DateTimeFormat('pt-BR', { timeZone: tz, ...o }).format(data)
const dia = fmt({ day: 'numeric', month: 'long' }).toLocaleUpperCase('pt-BR')
const hora = convite.festa.horarioDefinido ? fmt({ hour: '2-digit', minute: '2-digit' }).replace(':00', 'H').replace(':', 'H') : ''

// um raio fractal (sempre o mesmo, pela semente) caindo atrás do emblema
const r = gerarRaio({ x: 760, y: -10 }, { x: 640, y: 250 }, { niveis: 8, galhos: 1.4, rnd: seeded(9) })
const linhas = r.galhos
  .map((g) => {
    const d = 'M' + g.pts.map((q) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' L')
    const w = 3.4 * g.w
    return `<path d="${d}" stroke="#5C8FE8" stroke-opacity=".12" stroke-width="${w * 10}"/><path d="${d}" stroke="#9CC6FF" stroke-opacity=".45" stroke-width="${w * 3}"/><path d="${d}" stroke="#F4FAFF" stroke-width="${w}"/>`
  })
  .join('')

const html = `<!doctype html><html><head><style>
@font-face{font-family:BN;src:url(${font('bebas-neue.woff2')})}
@font-face{font-family:IN;font-weight:100 900;src:url(${font('inter.woff2')})}
${temaCss(p)}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;position:relative;font-family:IN;color:${p.branco};
  background:radial-gradient(70% 70% at 55% 0%, #1A2742, transparent 70%), radial-gradient(50% 40% at 50% 100%, rgb(255 150 70/.12), transparent 70%), linear-gradient(180deg,#0A1120,#05070C 70%)}
.raio{position:absolute;inset:0}
.cidade{position:absolute;left:0;right:0;bottom:0;height:120px}
.cidade svg{width:100%;height:100%}
.emb{position:absolute;left:510px;top:92px;width:180px;filter:drop-shadow(0 0 40px rgb(127 184 255/.35)) drop-shadow(0 18px 30px rgb(0 0 0/.7))}
.k{position:absolute;left:0;right:0;top:46px;text-align:center;font-weight:600;font-size:18px;letter-spacing:.5em;color:#AEB9C9}
.t{position:absolute;left:0;right:0;top:318px;text-align:center;font-family:BN;font-size:132px;line-height:.9;letter-spacing:.04em;padding-top:.12em;
  background:linear-gradient(180deg,#F7F9FC 0%,#C9D2DE 40%,#6C7787 50%,#AEB8C6 62%,#EEF2F7 100%);-webkit-background-clip:text;color:transparent;
  filter:drop-shadow(0 3px 0 rgb(0 0 0/.6)) drop-shadow(0 0 26px rgb(127 184 255/.25))}
.d{position:absolute;left:0;right:0;top:500px;text-align:center;font-weight:600;font-size:24px;letter-spacing:.34em;color:${p.eletrico}}
.l{position:absolute;left:0;right:0;top:546px;text-align:center;font-weight:500;font-size:20px;letter-spacing:.12em;color:#AEB9C9}
.grao{position:absolute;inset:0;opacity:.06;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.vin{position:absolute;inset:0;background:radial-gradient(90% 90% at 50% 45%,transparent 55%,rgb(0 0 0/.65))}
</style></head><body>
<svg class="raio" viewBox="0 0 1200 630" fill="none" stroke-linecap="round" stroke-linejoin="round">${linhas}</svg>
<div class="cidade">${cidadeSvg({ fundo: '#0B111C', frente: '#06090F', contorno: '#0F1726', janela: 'rgba(255,196,120,.42)' }, { seed: 4, contorno: false, janela: [1.6, 1.8], chance: 0.16, altura: 1.25 })}</div>
<p class="k">UMA NOVA MISSÃO</p>
<div class="emb">${emblemaSvg(p, { attrs: 'width="100%"' })}</div>
<p class="t">${c.nome} · ${c.idade} anos</p>
<p class="d">${dia}${hora ? ` · ${hora}` : ''}</p>
<p class="l">${convite.festa.local}</p>
<div class="grao"></div><div class="vin"></div>
</body></html>`

fs.mkdirSync(path.join(root, 'screenshots'), { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.setContent(html)
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(300)
const og = path.join(root, 'public/og.jpg')
await page.screenshot({ path: og, type: 'jpeg', quality: 88 })

// miniatura: recorte quadrado central em ~96 px (como na lista de conversas do WhatsApp)
const thumb = await browser.newPage({ viewport: { width: 330, height: 120 } })
const b64 = fs.readFileSync(og).toString('base64')
await thumb.setContent(`<body style="margin:0;display:flex;gap:12px;padding:12px;background:#fff">
  <div style="width:96px;height:96px;background:url(data:image/jpeg;base64,${b64}) center/auto 96px no-repeat;border-radius:8px"></div>
  <div style="width:183px;height:96px;background:url(data:image/jpeg;base64,${b64}) center/cover;border-radius:8px"></div></body>`)
await thumb.waitForTimeout(200)
await thumb.screenshot({ path: path.join(root, 'screenshots/og-miniatura.png') })

// ícone da tela inicial (iPhone): o emblema de metal sobre o céu escuro
await page.setViewportSize({ width: 180, height: 180 })
await page.setContent(`<body style="margin:0;width:180px;height:180px;display:grid;place-items:center;background:radial-gradient(80% 80% at 50% 20%,#1A2742,#05070C)"><div style="width:120px">${emblemaSvg(p, { attrs: 'width="100%"' })}</div></body>`)
await page.screenshot({ path: path.join(root, 'public/apple-touch-icon.png') })
await browser.close()
console.log('og.jpg, apple-touch-icon.png e screenshots/og-miniatura.png gerados')
