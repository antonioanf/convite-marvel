/**
 * Prints das seções Missão, Poderes (com a Sobrecarga) e Aceitar missão no iPhone 13 e no 360x740,
 * e uma checagem de tamanhos: fonte mínima, altura de botões/campo e linhas que quebram.
 * Uso: node scripts/compacto.mjs <rótulo> [url]  →  screenshots/compacto/<rótulo>-*.png
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const [rotulo = 'agora', url = 'http://localhost:4175/'] = process.argv.slice(2)
mkdirSync('screenshots/compacto', { recursive: true })
const aparelhos = {
  iphone13: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 },
  '360x740': { viewport: { width: 360, height: 740 }, deviceScaleFactor: 2 },
}
const b = await chromium.launch()
for (const [nome, ap] of Object.entries(aparelhos)) {
  const ctx = await b.newContext({ ...ap, isMobile: true, hasTouch: true, locale: 'pt-BR', reducedMotion: 'reduce' })
  const p = await ctx.newPage()
  await p.goto(url + '?abrir=1&modo=normal', { waitUntil: 'load' })
  await p.waitForTimeout(2500)
  // rola tudo para as seções aparecerem (reveal) e o fundo carregar
  await p.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 300) {
      scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 60))
    }
  })
  await p.waitForTimeout(800)
  const alturas = {}
  for (const id of ['missao', 'poderes', 'confirmar']) {
    const el = p.locator('#' + id)
    await el.scrollIntoViewIfNeeded()
    await p.waitForTimeout(500)
    alturas[id] = Math.round((await el.boundingBox()).height)
    await el.screenshot({ path: `screenshots/compacto/${rotulo}-${nome}-${id}.png` })
  }
  const r = await p.evaluate(() => {
    const secs = [...document.querySelectorAll('#missao, #poderes, #confirmar')]
    const menores = {}
    const quebras = []
    for (const s of secs)
      for (const el of s.querySelectorAll('*')) {
        const t = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(' ')
        if (!t || el.closest('.sr-only') || el.closest('[aria-hidden="true"] svg')) continue
        const cs = getComputedStyle(el)
        if (cs.display === 'none' || el.getClientRects().length === 0) continue
        const fs = parseFloat(cs.fontSize)
        const k = `${fs}px`
        ;(menores[k] ??= new Set()).add(t.slice(0, 28))
        // linhas: altura do texto / altura de linha
        const tops = new Set()
        for (const n of el.childNodes) {
          if (n.nodeType !== 3 || !n.textContent.trim()) continue
          const rg = document.createRange()
          rg.selectNodeContents(n)
          for (const q of rg.getClientRects()) if (q.width > 1) tops.add(Math.round(q.top / 4))
        }
        const linhas = tops.size
        if (linhas > 1 && !el.matches('p')) quebras.push(`${t.slice(0, 30)} (${linhas} linhas)`)
        if (el.scrollWidth > el.clientWidth + 1 && cs.overflow !== 'visible' && !el.classList.contains('truncate')) quebras.push(`TRANSBORDA: ${t.slice(0, 30)}`)
      }
    const alvos = [...document.querySelectorAll('#missao .btn, #poderes .btn, #confirmar .btn, #confirmar .field, #confirmar button')]
      .filter((e) => e.getClientRects().length)
      .map((e) => `${(e.textContent || e.placeholder || '').trim().slice(0, 18)}: ${Math.round(e.getBoundingClientRect().height)}px`)
    const campo = document.querySelector('#confirmar .field')
    return {
      fontes: Object.entries(menores).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])).map(([k, v]) => `${k}: ${[...v].slice(0, 4).join(' | ')}`),
      quebras,
      alvos,
      campo: campo && getComputedStyle(campo).fontSize,
      larguraPagina: document.documentElement.scrollWidth,
    }
  })
  console.log(`\n== ${rotulo} · ${nome} · alturas`, JSON.stringify(alturas), '· largura', r.larguraPagina)
  console.log('fontes:\n  ' + r.fontes.join('\n  '))
  console.log('alvos de toque:', r.alvos.join(' · '))
  console.log('campo de nome:', r.campo)
  console.log('quebras/transbordos:', r.quebras.length ? '\n  ' + r.quebras.join('\n  ') : 'nenhum')
  // credencial: envia um nome longo e confere que nada é cortado
  await p.locator('#confirmar').scrollIntoViewIfNeeded()
  await p.fill('#confirmar input', 'Maria Eduarda')
  await p.press('#confirmar input', 'Enter')
  await p.waitForSelector('.credencial', { timeout: 15000 })
  await p.waitForTimeout(1500)
  await p.locator('#confirmar').screenshot({ path: `screenshots/compacto/${rotulo}-${nome}-credencial.png` })
  const cred = await p.evaluate(() =>
    [...document.querySelectorAll('#confirmar .credencial p, #confirmar .credencial .selo-aprovado, #confirmar .btn, #confirmar button')]
      .map((e) => `${e.textContent.trim().slice(0, 20)}=${getComputedStyle(e).fontSize}/${Math.round(e.getBoundingClientRect().height)}px${e.scrollWidth > e.clientWidth + 1 ? ' CORTADO' : ''}`)
      .join(' · '),
  )
  console.log('credencial (fonte/altura):', cred)
  await ctx.close()
}
await b.close()
