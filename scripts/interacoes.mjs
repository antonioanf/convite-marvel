// Testes de interação (Playwright, Pixel 5). Uso: node scripts/interacoes.mjs [url]
// Cada teste imprime OK/FALHOU; o processo sai com código 1 se algum falhar.
import { chromium, devices } from 'playwright'
import fs from 'node:fs'
import { convite } from '../src/config/convite.ts'

const url = process.argv[2] ?? 'http://localhost:5173/'
const out = 'screenshots/interacoes'
fs.mkdirSync(out, { recursive: true })
const { defaultBrowserType, ...pixel } = devices['Pixel 5'] // eslint-disable-line no-unused-vars
const browser = await chromium.launch()
const log = []
const results = []
const ctxOpts = { ...pixel, locale: 'pt-BR', timezoneId: 'America/Fortaleza', permissions: ['clipboard-read', 'clipboard-write'] }
const check = (name, ok, extra = '') => {
  results.push({ name, ok })
  log.push(`${ok ? 'OK     ' : 'FALHOU '} ${name}${extra ? ` (${extra})` : ''}`)
}
const newPage = async (q = '', opts = {}) => {
  const page = await (await browser.newContext({ ...ctxOpts, ...opts })).newPage()
  page.on('pageerror', (e) => log.push('pageerror ' + e.message))
  await page.goto(url + q)
  return page
}
const scrollTo = async (page, id) => {
  await page.waitForSelector('#' + id, { timeout: 15000 })
  await page.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'center' }), id)
}
const dia = convite.festa.dataHora.slice(0, 10)
const diaSeguinte = new Date(Date.parse(dia) + 86_400_000).toISOString().slice(0, 10)

// 1) abertura quadro a quadro
{
  const page = await newPage()
  await page.waitForTimeout(800)
  await page.tap('#intro')
  for (const ms of [450, 900, 1300, 2000]) {
    await page.waitForTimeout(ms === 450 ? 450 : ms === 900 ? 450 : ms === 1300 ? 400 : 700)
    await page.screenshot({ path: `${out}/abertura-${ms}.png` })
  }
  check('intro some depois do toque', (await page.locator('#intro').count()) === 0)
}

// 2) raspadinha da data
{
  const page = await newPage('?abrir=1&teste=1')
  await page.waitForTimeout(1500)
  await scrollTo(page, 'local')
  await page.waitForTimeout(1500)
  const cv = page.locator('#local .scratch canvas')
  const box = await cv.boundingBox()
  await page.screenshot({ path: `${out}/raspadinha-antes.png` })
  // raspa em zigue-zague até ~70% da área
  await page.mouse.move(box.x + 6, box.y + 6)
  await page.mouse.down()
  for (let row = 0; row <= 4; row++) {
    const y = box.y + 8 + (row * (box.height - 16)) / 4
    for (let i = 0; i <= 12; i++) {
      const x = row % 2 === 0 ? box.x + (i / 12) * box.width : box.x + box.width - (i / 12) * box.width
      await page.mouse.move(x, y, { steps: 2 })
    }
  }
  await page.mouse.up()
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${out}/raspadinha-depois.png` })
  const rev = await page.locator('#local .scratch').getAttribute('data-revealed')
  check('raspadinha revela a data depois de raspar ~60%', rev === 'true')
  // acessibilidade: a data está no HTML mesmo antes de raspar
  const txt = await page.locator('#local .scratch').innerText()
  check('data presente no texto (leitores de tela)', /2027/.test(txt), txt.split('\n')[0])
}
// 2a) raspar com o DEDO (eventos de toque reais) não rola a página; fora do cartão, rola
{
  const page = await newPage('?abrir=1&teste=1')
  await page.waitForTimeout(1500)
  await scrollTo(page, 'local')
  await page.waitForTimeout(1500)
  const cdp = await page.context().newCDPSession(page)
  // arrasto vertical com o dedo (eventos de toque reais, que rolam a página quando permitido)
  const drag = async (x, y0, y1) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] })
    for (let i = 1; i <= 15; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 + ((y1 - y0) * i) / 15 }] })
      await page.waitForTimeout(16)
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await page.waitForTimeout(700)
  }
  const box = await page.locator('#local .scratch canvas').boundingBox()
  const y0 = await page.evaluate(() => window.scrollY)
  await drag(box.x + box.width / 2, box.y + box.height - 10, box.y + 10) // arrasta para cima, dentro da raspadinha
  const y1 = await page.evaluate(() => window.scrollY)
  const raspou = await page.evaluate(() => {
    const c = document.querySelector('#local .scratch canvas')
    if (!c) return true
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
    for (let i = 3; i < d.length; i += 4) if (d[i] < 40) return true
    return false
  })
  check('raspar com o dedo não rola a página (touch-action: none)', y1 === y0 && raspou, `scrollY ${y0} → ${y1}`)
  // controle: o mesmo gesto fora da raspadinha rola normalmente
  const card = await page.locator('#local .card').nth(3).boundingBox()
  await drag(card.x + card.width / 2, card.y + card.height - 20, card.y + 20)
  const y2 = await page.evaluate(() => window.scrollY)
  check('controle: o mesmo gesto fora da raspadinha rola a página', y2 > y1 + 50, `scrollY ${y1} → ${y2}`)
}
// 2b) reduced motion: data já aparece revelada
{
  const page = await newPage('?abrir=1', { reducedMotion: 'reduce' })
  await page.waitForTimeout(1500)
  check('raspadinha já revelada com prefers-reduced-motion', (await page.locator('#local .scratch').getAttribute('data-revealed')) === 'true')
}

// 3) velinhas: segurar o dedo apaga; soltar antes não apaga
{
  const page = await newPage('?abrir=1&teste=1')
  await page.waitForTimeout(1500)
  await scrollTo(page, 'velinhas')
  await page.waitForTimeout(1500)
  const btn = page.locator('#velinhas .candles-hit')
  const b = await btn.boundingBox()
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
  // toque curto: não apaga
  await page.mouse.down()
  await page.waitForTimeout(300)
  await page.mouse.up()
  await page.waitForTimeout(700)
  check('toque curto não apaga as velas', (await page.locator('#velinhas [data-velas]').getAttribute('data-velas')) === 'acesas')
  await page.screenshot({ path: `${out}/velinhas-acesas.png` })
  // segurar ~1,6 s: apaga
  await page.mouse.down()
  await page.waitForTimeout(1700)
  await page.mouse.up()
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${out}/velinhas-apagadas.png` })
  check('segurar o dedo apaga as velas', (await page.locator('#velinhas [data-velas]').getAttribute('data-velas')) === 'apagadas')
  const msg = await page.locator('#velinhas [role=status]').innerText().catch(() => '')
  check('mensagem do pedido aparece', /pedido/i.test(msg), msg)
}

// 4) pegue as borboletas (modo leve): tocar nelas até 10; sempre entra outra
for (const modo of ['leve', '3d']) {
  const page = await newPage(`?abrir=1&teste=1&modo=${modo}`)
  await page.waitForTimeout(2500)
  const t0 = Date.now()
  let caught = 0
  while (caught < 10 && Date.now() - t0 < 90_000) {
    const p = await page.evaluate(() => {
      const f = window.__convite.field
      const b = f.butterflies.find((b) => b.life >= 3 && b.x > 30 && b.x < f.width - 30 && b.y > 90 && b.y < f.height - 120)
      return b ? { x: b.x + b.vx * 0.05, y: b.y + b.vy * 0.05 } : null
    })
    if (p) await page.touchscreen.tap(p.x, p.y)
    await page.waitForTimeout(p ? 150 : 400)
    caught = await page.evaluate(() => window.__convite.field.caught)
  }
  const secs = ((Date.now() - t0) / 1000).toFixed(1)
  check(`pegar 10 borboletas (modo ${modo})`, caught >= 10, `${caught} em ${secs}s`)
  await page.waitForTimeout(800)
  const dialog = await page.locator('[role=dialog]').innerText().catch(() => '')
  check(`mensagem surpresa ao pegar 10 (modo ${modo})`, /conseguiu/i.test(dialog))
  await page.screenshot({ path: `${out}/borboletas-10-${modo}.png` })
}

// 5a) sem "chacoalhar": o toque de abertura liga só a inclinação da foto (deviceorientation), não o devicemotion
{
  // sensores liberados, como no Chrome do Android (lá a permissão já vem concedida)
  const context = await browser.newContext({ ...ctxOpts, permissions: [...ctxOpts.permissions, 'accelerometer', 'gyroscope', 'magnetometer'] })
  await context.addInitScript(() => {
    window.__ouvintes = []
    const add = window.addEventListener
    window.addEventListener = function (type, ...rest) {
      window.__ouvintes.push(type)
      return add.call(this, type, ...rest)
    }
  })
  const page = await context.newPage()
  await page.goto(url)
  await page.waitForTimeout(800)
  await page.tap('#intro')
  await page.waitForTimeout(1500)
  const ouvintes = await page.evaluate(() => window.__ouvintes)
  const txt = await page.locator('body').innerText()
  check('sem chacoalhar: a inclinação continua e não há devicemotion', ouvintes.includes('deviceorientation') && !ouvintes.includes('devicemotion') && !/chacoalh/i.test(txt))
  await context.close()
}

// 5b) toque em área vazia solta 2–3 borboletas
{
  const page = await newPage('?abrir=1&teste=1&modo=leve')
  await page.waitForTimeout(2500)
  // toque numa área vazia (fora de botões), longe das borboletas
  const n0 = await page.evaluate(() => window.__convite.field.butterflies.length)
  const spot = await page.evaluate(() => {
    const f = window.__convite.field
    for (let y = 520; y < 700; y += 20) for (let x = 40; x < 340; x += 20) if (f.butterflies.every((b) => Math.hypot(b.x - x, b.y - y) > 80)) return { x, y }
    return { x: 195, y: 600 }
  })
  await page.touchscreen.tap(spot.x, spot.y)
  await page.waitForTimeout(100)
  const n1 = await page.evaluate(() => window.__convite.field.butterflies.length)
  check('toque em área vazia solta 2–3 borboletas', n1 - n0 >= 2 && n1 - n0 <= 3, `${n0} → ${n1}`)
}

// 6) lightbox + RSVP (+ Pix se existir)
{
  const page = await newPage('?abrir=1')
  await page.waitForTimeout(1500)
  await scrollTo(page, 'galeria')
  await page.waitForTimeout(1500)
  await page.tap('#galeria .carousel button')
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${out}/lightbox.png` })
  check('lightbox abre', (await page.locator('[role=dialog]').count()) === 1)
  {
    // fotos sem legenda na tela: a descrição fica só no alt (leitores de tela)
    const alts = convite.galeria.map((f) => f.alt)
    const visivel = await page.locator('body').innerText()
    const comAlt = await page.evaluate(() => [...document.querySelectorAll('img')].every((i) => i.alt.trim().length > 10))
    const destaque = await page.locator('#tres').innerText()
    check('fotos sem legenda visível (só alt)', alts.every((a) => !visivel.includes(a)) && !/ensaio/i.test(destaque) && comAlt)
  }
  const box = await page.locator('[role=dialog] > div').nth(1).boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + 300)
  await page.mouse.down()
  for (let i = 1; i <= 10; i++) await page.mouse.move(box.x + box.width / 2, box.y + 300 + i * 25)
  await page.mouse.up()
  await page.waitForTimeout(800)
  check('lightbox fecha puxando para baixo', (await page.locator('[role=dialog]').count()) === 0)

  await scrollTo(page, 'confirmar')
  await page.waitForTimeout(1500)
  await page.tap('#confirmar button[type=submit]')
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${out}/rsvp-erro.png` })
  check('RSVP pede o nome', /nome/i.test((await page.locator('#confirmar [role=alert]').textContent()) ?? ''))
  await page.fill('#confirmar input[name=nome]', 'Ana e família')
  check('RSVP sem campo de quantas pessoas', (await page.locator('#confirmar input[name=pessoas], #confirmar button[aria-label=Aumentar]').count()) === 0)
  await page.fill('#confirmar textarea', `Parabéns, ${convite.crianca.nome}! 💜`)
  let whats = ''
  await page.route('https://wa.me/**', (r) => {
    whats = decodeURIComponent(r.request().url())
    r.fulfill({ body: 'ok' })
  })
  await page.tap('#confirmar button[type=submit]')
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${out}/rsvp-check.png`, timeout: 5000 }).catch(() => {}) // com WhatsApp, a página navega logo depois
  await page.waitForTimeout(1600)
  if (convite.rsvp.whatsapp) check('RSVP abre o WhatsApp com a mensagem', /Nome: Ana e família/.test(whats) && !/Pessoas/.test(whats), whats.slice(0, 60))
  else check('RSVP sem WhatsApp mostra aviso', /não foi configurado/.test(await page.locator('#confirmar').innerText()))

  if (convite.pix && convite.secoes.pix) {
    await page.goto(url + '?abrir=1')
    await page.waitForTimeout(1200)
    await scrollTo(page, 'presentes')
    await page.waitForTimeout(1500)
    await page.tap('#presentes button')
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${out}/pix-copiado.png` })
    check('Pix copia a chave', (await page.evaluate(() => navigator.clipboard.readText())) === convite.pix.chave)
  } else {
    check('Pix escondido quando pix = null', (await page.locator('#presentes').count()) === 0)
  }
  const ics = (await (await page.request.get(url + 'convite.ics')).text()).split('\r\n')
  const start = ics.find((l) => l.startsWith('DTSTART')) ?? ''
  const end = ics.find((l) => l.startsWith('DTEND')) ?? ''
  const utc = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const t0 = Date.parse(convite.festa.dataHora)
  const t1 = t0 + convite.festa.duracaoHoras * 3600_000
  if (convite.festa.horarioDefinido) {
    check('.ics no horário da festa, com a duração do config', start === `DTSTART:${utc(t0)}` && end === `DTEND:${utc(t1)}`, `${start} ${end}`)
    await page.goto(url + '?abrir=1') // depois do RSVP a página pode ter ido para o WhatsApp
    await page.waitForTimeout(1200)
    await scrollTo(page, 'local')
    await page.locator('#local button[aria-expanded]').click()
    await page.waitForTimeout(600)
    const gcal = await page.locator('#local a[href*="calendar.google.com"]').getAttribute('href').catch(() => null)
    const dates = gcal ? new URL(gcal).searchParams.get('dates') : null
    check('Google Agenda no horário da festa, com a duração do config', dates === `${utc(t0)}/${utc(t1)}`, dates ?? 'link não encontrado')
    const local = await page.locator('#local').innerText()
    const hhmm = convite.festa.dataHora.slice(11, 16)
    check(`cartão de Horário mostra ${hhmm}`, local.includes(hhmm) && !local.includes('A definir'))
  } else {
    check('.ics de dia inteiro (horário a definir)', start === `DTSTART;VALUE=DATE:${dia.replace(/-/g, '')}`, start)
  }
}

// 6b) sem compartilhar: só os pais enviam o link
{
  const page = await newPage('?abrir=1')
  await page.waitForTimeout(1500)
  const txt = await page.locator('body').innerText()
  check('sem botão de compartilhar o convite', !/compartilh/i.test(txt))
  check('sem o rótulo "Convite · Nº" no topo', !/convite\s*·\s*n[º°]/i.test(await page.locator('#inicio').innerText()))
}

// 7) estados da contagem
for (const [nome, agora] of [['hoje', `${dia}T10:00`], ['depois', `${diaSeguinte}T10:00`]]) {
  const page = await newPage(`?abrir=1&agora=${agora}`)
  await page.waitForTimeout(1200)
  await scrollTo(page, 'contagem')
  await page.waitForTimeout(1800)
  await page.screenshot({ path: `${out}/contagem-${nome}.png` })
  const txt = await page.locator('#contagem').innerText()
  check(`contagem no estado "${nome}"`, nome === 'hoje' ? /É hoje/.test(txt) : /Obrigado/.test(txt))
}

// 8) desktop com moldura
{
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
  await page.goto(url)
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `${out}/desktop.png` })
  check('moldura de celular no desktop', (await page.locator('.desk-phone iframe').count()) === 1)
}

await browser.close()
console.log(log.join('\n'))
const failed = results.filter((r) => !r.ok).length
console.log(`\n${results.length - failed}/${results.length} testes passaram`)
process.exit(failed ? 1 : 0)
