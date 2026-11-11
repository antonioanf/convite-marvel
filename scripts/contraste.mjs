/**
 * Contraste de TODO texto do convite, contra o PIOR pixel do fundo:
 *  - para cada texto: esconde as letras, fotografa o que fica atrás e pega o pixel mais claro
 *    (texto claro) ou mais escuro (texto escuro) — sem média nem percentil;
 *  - mede com o texto no alto, no meio e embaixo da tela (o fundo fixo passa por trás ao rolar),
 *    com as animações rodando (brasas, raios de sol, eletricidade);
 *  - texto em degradê (metal): a cor do texto é tirada das próprias letras (pixels que mudam
 *    quando o texto aparece), usando o tom mais escuro delas (25%).
 * Mínimo: 4,5:1 texto normal; 3:1 título grande (≥ 24 px, ou ≥ 18,7 px em negrito).
 * Uso: node scripts/contraste.mjs [url] [--aparelho=360x740]
 */
import { chromium } from 'playwright'
import sharp from 'sharp'

const url = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:5173/'
const ap = (process.argv.find((a) => a.startsWith('--aparelho=')) ?? '--aparelho=iphone13').split('=')[1]
const viewport = ap === '360x740' ? { width: 360, height: 740 } : { width: 390, height: 844 }
const b = await chromium.launch()
const p = await (await b.newContext({ viewport, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: 'pt-BR' })).newPage()
await p.goto(url + '?abrir=1&modo=normal', { waitUntil: 'load' })
await p.waitForTimeout(3500) // céu pintado, título aceso
// rola um pouco para a imagem de fundo das seções baixar (ela é preguiçosa) e espera ela aparecer
await p.evaluate(() => window.scrollTo(0, innerHeight))
await p.waitForFunction(() => !document.querySelector('.fundo-secoes img') || document.querySelector('.fundo-secoes img').classList.contains('pronta'), null, { timeout: 15000 }).catch(() => {})
await p.waitForTimeout(1000)
// barras fixas (progresso, botão de baixo) não são fundo do texto; entradas (reveal) já completas
await p.addStyleTag({ content: '.progress, .fixed { display: none !important } .reveal { opacity: 1 !important; transform: none !important } .ct-oculto, .ct-oculto * { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important }' })

const lum = ([r, g, bb]) => {
  const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bb)
}
const razaoL = (a, c) => (Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05)

const SEL = [
  '#inicio p',
  '.secao-titulo p',
  '.secao-titulo h2',
  '.secao-titulo span.mono',
  '.cartao p',
  '.cartao h3',
  '.cartao label',
  '.cartao .cont-num',
  '.cartao .cont-un > .rotulo',
  '.cartao-cab > span',
  '.cod',
  '.rodape-txt p',
]
const alvos = await p.evaluate((sel) => {
  const out = []
  let i = 0
  document.querySelectorAll(sel.join(',')).forEach((el) => {
    const txt = el.textContent.trim()
    const r = el.getBoundingClientRect()
    if (!txt || r.width < 2 || el.closest('[aria-hidden="true"]:not(.cod)') || el.closest('.sr-only, .sr-only-live')) return
    el.setAttribute('data-ct', String(++i))
    const cs = getComputedStyle(el)
    const m = cs.color.match(/[\d.]+/g).map(Number)
    const peso = Number(cs.fontWeight)
    const tam = parseFloat(cs.fontSize)
    out.push({ i, txt: txt.slice(0, 30), cor: m[3] === 0 ? null : m.slice(0, 3), grande: tam >= 24 || (tam >= 18.66 && peso >= 700) })
  })
  return out
}, SEL)

const raw = async (png) => {
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data, n: info.width * info.height }
}
const res = []
for (const a of alvos) {
  let pior = Infinity
  for (const pos of ['start', 'center', 'end']) {
    const box = await p.evaluate(
      ([i, pos]) => {
        const el = document.querySelector(`[data-ct="${i}"]`)
        el.scrollIntoView({ block: pos })
        // só a área das letras (sem o espaçamento interno do elemento)
        const rg = document.createRange()
        rg.selectNodeContents(el)
        const r = rg.getBoundingClientRect()
        const x = Math.max(0, Math.floor(r.left)), y = Math.max(0, Math.floor(r.top))
        return { x, y, w: Math.min(innerWidth, Math.ceil(r.right)) - x, h: Math.min(innerHeight, Math.ceil(r.bottom)) - y }
      },
      [a.i, pos],
    )
    if (box.w < 2 || box.h < 2) continue
    await p.waitForTimeout(250)
    const clip = { x: box.x, y: box.y, width: box.w, height: box.h }
    const com = await raw(await p.screenshot({ clip }))
    // esconde só as LETRAS: texto comum fica transparente (o fundo do próprio elemento, como uma
    // faixa escura, continua); texto em degradê (a letra é o fundo recortado) some com visibility
    await p.evaluate((i) => {
      const el = document.querySelector(`[data-ct="${i}"]`)
      if (getComputedStyle(el).backgroundClip === 'text' || getComputedStyle(el).webkitBackgroundClip === 'text') el.style.visibility = 'hidden'
      else el.classList.add('ct-oculto')
    }, a.i)
    // 3 amostras do fundo (as animações mudam o pior pixel)
    let fundoMax = 0
    let fundoMin = 1
    let sem
    for (let k = 0; k < 3; k++) {
      sem = await raw(await p.screenshot({ clip }))
      for (let j = 0; j < sem.data.length; j += 3) {
        const l = lum([sem.data[j], sem.data[j + 1], sem.data[j + 2]])
        if (l > fundoMax) fundoMax = l
        if (l < fundoMin) fundoMin = l
      }
      await p.waitForTimeout(120)
    }
    await p.evaluate((i) => {
      const el = document.querySelector(`[data-ct="${i}"]`)
      el.style.visibility = ''
      el.classList.remove('ct-oculto')
    }, a.i)
    let texto
    if (a.cor) texto = lum(a.cor)
    else {
      // degradê: pixels que mudaram com o texto visível = letras
      const ls = []
      for (let j = 0; j < com.data.length; j += 3) {
        const d = Math.abs(com.data[j] - sem.data[j]) + Math.abs(com.data[j + 1] - sem.data[j + 1]) + Math.abs(com.data[j + 2] - sem.data[j + 2])
        if (d > 120) ls.push(lum([com.data[j], com.data[j + 1], com.data[j + 2]]))
      }
      ls.sort((x, y) => x - y)
      texto = ls.length ? ls[Math.floor(ls.length * 0.25)] : 1
    }
    // texto claro: pior = fundo mais claro; texto escuro: pior = fundo mais escuro
    const c = texto > fundoMax ? razaoL(texto, fundoMax) : texto < fundoMin ? razaoL(texto, fundoMin) : 1
    if (process.env.DEBUG && c < 4.5) console.log("  [dbg]", a.txt, pos, "texto", texto.toFixed(3), "fundo", fundoMin.toFixed(3), "-", fundoMax.toFixed(3), "box", JSON.stringify(box))
    pior = Math.min(pior, c)
  }
  if (pior === Infinity) continue
  const min = a.grande ? 3 : 4.5
  res.push({ texto: a.txt, contraste: +pior.toFixed(2), minimo: min, ok: pior >= min })
}
console.log(`Aparelho: ${ap} (${viewport.width}x${viewport.height})`)
console.table(res)
const ruins = res.filter((x) => !x.ok)
console.log(ruins.length ? `ABAIXO DO MÍNIMO: ${ruins.length} de ${res.length}` : `TUDO OK: ${res.length} textos`)
await b.close()
