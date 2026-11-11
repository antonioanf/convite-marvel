/**
 * Gera public/og.jpg (1200x630, prévia do link no WhatsApp) e public/apple-touch-icon.png
 * a partir do src/config/convite.ts. Uso: npm run og
 *
 * Composição: o quadrado central (x 285–915) funciona sozinho — é o recorte que o WhatsApp
 * usa na miniatura pequena: foto + nome + idade. As laterais completam a versão grande.
 * Também salva screenshots/og-miniatura.png (como fica em ~96 px) para conferir a leitura.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { convite } from '../src/config/convite.ts'
import { temaVars } from '../src/config/tema.ts'

const root = path.resolve(import.meta.dirname, '..')
const font = (f) => `data:font/woff2;base64,${fs.readFileSync(path.join(root, 'public/fonts', f)).toString('base64')}`
const v = temaVars(convite.paleta)
const p = convite.paleta
const c = convite.crianca
const foto = convite.fotoPrincipal.src ? path.join(root, 'public', convite.fotoPrincipal.src) : null
const fotoData = foto && fs.existsSync(foto) ? `data:image/webp;base64,${fs.readFileSync(foto).toString('base64')}` : null
const fav = fs.readFileSync(path.join(root, 'public/favicon.svg'), 'utf8')
const tz = convite.festa.fusoHorario
const data = new Date(convite.festa.dataHora)
const fmt = (o) => new Intl.DateTimeFormat('pt-BR', { timeZone: tz, ...o }).format(data)
const dataCurta = fmt({ day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join(' · ')
const semana = fmt({ weekday: 'long' })
const diaMes = fmt({ day: 'numeric', month: 'long' })
const bfly = (s, x, y, r, o = 1) =>
  `<div style="position:absolute;left:${x}px;top:${y}px;width:${s}px;height:${s}px;transform:rotate(${r}deg);opacity:${o};filter:drop-shadow(0 8px 16px ${p.violeta}66)">${fav}</div>`

const html = `<!doctype html><html><head><style>
@font-face{font-family:IS;font-style:italic;src:url(${font('instrument-serif-italic.woff2')})}
@font-face{font-family:MR;font-weight:200 800;src:url(${font('manrope.woff2')})}
@font-face{font-family:JB;font-weight:100 800;src:url(${font('jetbrains-mono.woff2')})}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;font-family:MR;color:${p.roxo};position:relative;
  background:radial-gradient(40% 55% at 12% 20%, ${p.lavanda}, transparent 70%),
    radial-gradient(38% 50% at 92% 18%, ${p.holoRosa}aa, transparent 70%),
    radial-gradient(40% 55% at 85% 95%, ${p.holoCiano}88, transparent 70%),
    radial-gradient(45% 55% at 10% 95%, ${p.lilas}88, transparent 70%), ${p.perola}}
.mono{font-family:JB;letter-spacing:.22em;text-transform:uppercase;font-weight:600}
.serif{font-family:IS;font-style:italic;font-weight:400}
.foto{position:absolute;left:395px;top:28px;width:410px;height:574px;border-radius:40px;overflow:hidden;
  box-shadow:0 40px 70px -30px ${p.violeta}cc, inset 0 0 0 2px #ffffff88;background:${p.lilas}}
.foto img{width:100%;height:100%;object-fit:cover;object-position:50% 72%}
.fade{position:absolute;inset:auto 0 0 0;height:50%;background:linear-gradient(to top, rgb(43 18 84 / .86), rgb(43 18 84 / .5) 50%, transparent)}
.nome{position:absolute;left:28px;right:20px;bottom:78px;font-size:104px;line-height:.9;color:#fff;letter-spacing:-.02em;text-shadow:0 4px 30px rgb(43 18 84 / .6);white-space:nowrap}
.selo{position:absolute;left:712px;top:6px;width:150px;height:150px;border-radius:50%;display:grid;place-items:center;transform:rotate(-8deg);
  background:radial-gradient(circle at 30% 25%, #fff, #ffffffee 60%, ${p.prata});box-shadow:0 18px 34px -14px ${p.violeta}cc;border:3px solid #fff}
.holo{background:linear-gradient(160deg, ${v['--color-btn-a']}, ${p.magenta} 35%, ${p.violeta} 60%, #4fb3d1 85%);-webkit-background-clip:text;color:transparent}
.selo .n{font-size:118px;line-height:.75;margin-top:6px}
.fdata{position:absolute;left:32px;bottom:34px;font-size:30px;font-weight:700;letter-spacing:.12em;color:#fff;text-shadow:0 2px 14px rgb(43 18 84 / .7);white-space:nowrap}
.esq{position:absolute;left:56px;top:150px;width:310px}
.dir{position:absolute;left:845px;top:205px;width:320px}
.k{font-size:17px;color:${v['--color-tinta-2']}}
.t{font-size:62px;line-height:.98;margin-top:14px}
.data{font-size:34px;letter-spacing:.06em;color:${p.roxo};white-space:nowrap}
.s{font-size:24px;font-weight:600;color:${v['--color-tinta-2']};margin-top:10px}
.pill{display:inline-block;margin-top:26px;padding:12px 22px;border-radius:999px;color:#fff;font-weight:700;font-size:21px;
  background:linear-gradient(115deg, ${v['--color-btn-a']}, ${v['--color-btn-b']});box-shadow:0 14px 30px -12px ${p.magenta}aa}
</style></head><body>
${bfly(70, 40, 48, -18, 0.95)}${bfly(54, 300, 520, 20, 0.85)}${bfly(64, 1110, 520, 14, 0.9)}
<div class="esq">
  <p class="mono k">Aniversário</p>
  <p class="serif t">Vem voar<br>comigo!</p>
  <p class="s">${c.idade} aninhos</p>
</div>
<div class="foto">
  ${fotoData ? `<img src="${fotoData}">` : ''}
  <div class="fade"></div>
  <p class="serif nome">${c.nome}</p>
  <p class="mono fdata">${dataCurta}</p>
</div>
<div class="selo"><span class="serif holo n">${c.idade}</span></div>
<div class="dir">
  <p class="mono data">${dataCurta}</p>
  <p class="s">${semana.charAt(0).toUpperCase() + semana.slice(1)}, ${diaMes}</p>
  <p class="s" style="color:${p.roxo}">${convite.festa.local}</p>
  <span class="pill">Toque para abrir</span>
</div>
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

await page.setViewportSize({ width: 180, height: 180 })
await page.setContent(`<body style="margin:0;width:180px;height:180px;display:grid;place-items:center;background:radial-gradient(70% 70% at 30% 25%, ${p.lavanda}, ${p.perola} 60%, ${p.holoRosa}66)"><div style="width:128px;height:128px">${fav}</div></body>`)
await page.screenshot({ path: path.join(root, 'public/apple-touch-icon.png') })
await browser.close()
console.log('og.jpg, apple-touch-icon.png e screenshots/og-miniatura.png gerados')
