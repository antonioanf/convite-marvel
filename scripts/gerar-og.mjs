/**
 * Gera public/og.jpg (1200x630, prévia do link no WhatsApp) e public/apple-touch-icon.png
 * a partir do src/config/convite.ts e dos heróis da equipe. Uso: npm run og
 *
 * Composição: o quadrado central (x 285–915) funciona sozinho — é o recorte que o WhatsApp
 * usa na miniatura pequena: a equipe com o João Lucas no meio + nome + idade.
 * Também salva screenshots/og-miniatura.png (como fica em ~96 px) para conferir a leitura.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { convite } from '../src/config/convite.ts'
import { temaCss } from '../src/config/tema.ts'
import { emblemaSvg } from '../src/lib/emblema.ts'
import { heroiSvg } from '../src/lib/herois/index.ts'

const root = path.resolve(import.meta.dirname, '..')
const font = (f) => `data:font/woff2;base64,${fs.readFileSync(path.join(root, 'public/fonts', f)).toString('base64')}`
const p = convite.paleta
const c = convite.crianca
const tz = convite.festa.fusoHorario
const data = new Date(convite.festa.dataHora)
const fmt = (o) => new Intl.DateTimeFormat('pt-BR', { timeZone: tz, ...o }).format(data)
const dataCurta = fmt({ day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join(' · ')
const semana = fmt({ weekday: 'long' })
const diaMes = fmt({ day: 'numeric', month: 'long' })
const h = (id, w, x, y, z = 1) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;z-index:${z}">${heroiSvg(id, 'normal', p, { attrs: 'width="100%"' })}</div>`
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

const html = `<!doctype html><html><head><style>
@font-face{font-family:BG;src:url(${font('bangers.woff2')})}
@font-face{font-family:NU;font-weight:200 1000;src:url(${font('nunito.woff2')})}
@font-face{font-family:SM;src:url(${font('share-tech-mono.woff2')})}
${temaCss(p)}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;font-family:NU;color:${p.marinho};position:relative;
  background:radial-gradient(circle, rgb(255 255 255/.55) 1.6px, transparent 2.2px) 0 0/14px 14px, linear-gradient(180deg, ${p.ceu}, #FFE8B0)}
.raios{position:absolute;left:600px;top:360px;width:1800px;height:1800px;margin:-900px 0 0 -900px;
  background:repeating-conic-gradient(from 0deg, rgb(255 214 10/.35) 0 6deg, transparent 6deg 15deg)}
.bg{font-family:BG;letter-spacing:.05em;line-height:.95}
.faixa{position:absolute;left:330px;top:22px;width:540px;height:132px;transform:rotate(-2deg);z-index:5}
.faixa svg{position:absolute;inset:0;width:100%;height:100%}
.faixa p{position:absolute;left:12%;right:12%;top:4%;height:76%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.nome{font-size:66px;color:#fff;-webkit-text-stroke:2.5px ${p.marinho};paint-order:stroke fill;text-shadow:4px 4px 0 ${p.marinho}}
.idade{font-size:30px;color:${p.amarelo};-webkit-text-stroke:2px ${p.marinho};paint-order:stroke fill;text-shadow:3px 3px 0 ${p.marinho};letter-spacing:.12em}
.lado{position:absolute;top:190px;width:270px;z-index:6}
.box{background:#fff;border:4px solid ${p.marinho};border-radius:20px;box-shadow:6px 7px 0 ${p.marinho};padding:16px 18px}
.k{font-family:SM;font-size:20px;letter-spacing:.18em;text-transform:uppercase;color:${p.vermelho}}
.d{font-family:BG;font-size:46px;letter-spacing:.04em;margin-top:6px}
.s{font-size:22px;font-weight:800;line-height:1.25;margin-top:6px}
.pill{display:inline-block;margin-top:18px;padding:10px 20px;border-radius:16px;background:${p.amarelo};border:4px solid ${p.marinho};
  box-shadow:0 6px 0 ${p.marinho};font-family:BG;font-size:30px;letter-spacing:.06em}
</style></head><body>
<div class="raios"></div>
<div class="faixa">
  <svg viewBox="0 0 400 120" preserveAspectRatio="none">
    <polygon points="0,34 74,34 74,116 0,116 24,75" fill="${p.azul}" stroke="${p.marinho}" stroke-width="3" vector-effect="non-scaling-stroke"/>
    <polygon points="400,34 326,34 326,116 400,116 376,75" fill="${p.azul}" stroke="${p.marinho}" stroke-width="3" vector-effect="non-scaling-stroke"/>
    <polygon points="44,98 74,116 74,98" fill="${p.marinho}"/><polygon points="356,98 326,116 326,98" fill="${p.marinho}"/>
    <rect x="50" y="10" width="306" height="88" fill="${p.marinho}"/>
    <rect x="44" y="4" width="312" height="94" fill="${p.vermelho}" stroke="${p.marinho}" stroke-width="3" vector-effect="non-scaling-stroke"/>
  </svg>
  <p><span class="bg nome">${c.nome.toLocaleUpperCase('pt-BR')}</span><span class="bg idade">· ${c.idade} ANOS ·</span></p>
</div>
${h('faisca', 190, 330, 170)}${h('astra', 190, 680, 170)}${h('tremor', 210, 300, 330, 3)}${h('turbo', 200, 700, 320, 3)}${h('joao', 300, 450, 190, 2)}
<div class="lado" style="left:34px"><div class="box">
  <p class="k">${convite.equipe.nome}</p>
  <p class="bg d">Junte-se à equipe!</p>
  <p class="s">${c.frase}</p>
</div></div>
<div class="lado" style="right:34px;text-align:right"><div class="box">
  <p class="k">Missão</p>
  <p class="bg d">${dataCurta.replace(/ · /g, '/')}</p>
  <p class="s">${cap(semana)}, ${diaMes}</p>
  <p class="s">${convite.festa.local}</p>
</div><span class="pill">Toque para abrir</span></div>
</body></html>`

fs.mkdirSync(path.join(root, 'screenshots'), { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.setContent(html)
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(300)
const og = path.join(root, 'public/og.jpg')
await page.screenshot({ path: og, type: 'jpeg', quality: 86 })

// miniatura: recorte quadrado central em ~96 px (como na lista de conversas do WhatsApp)
const thumb = await browser.newPage({ viewport: { width: 330, height: 120 } })
const b64 = fs.readFileSync(og).toString('base64')
await thumb.setContent(`<body style="margin:0;display:flex;gap:12px;padding:12px;background:#fff">
  <div style="width:96px;height:96px;background:url(data:image/jpeg;base64,${b64}) center/auto 96px no-repeat;border-radius:8px"></div>
  <div style="width:183px;height:96px;background:url(data:image/jpeg;base64,${b64}) center/cover;border-radius:8px"></div></body>`)
await thumb.waitForTimeout(200)
await thumb.screenshot({ path: path.join(root, 'screenshots/og-miniatura.png') })

// ícone da tela inicial (iPhone): o emblema sobre o céu
await page.setViewportSize({ width: 180, height: 180 })
await page.setContent(`<body style="margin:0;width:180px;height:180px;display:grid;place-items:center;background:linear-gradient(180deg, ${p.ceu}, #fff)"><div style="width:120px">${emblemaSvg(p, { attrs: 'width="100%"' })}</div></body>`)
await page.screenshot({ path: path.join(root, 'public/apple-touch-icon.png') })
await browser.close()
console.log('og.jpg, apple-touch-icon.png e screenshots/og-miniatura.png gerados')
