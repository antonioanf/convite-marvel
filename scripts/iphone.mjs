/**
 * Testes no WebKit do Playwright emulando o iPhone 13 (o mais perto do Safari do iPhone que roda aqui).
 * Toques: o toque duplo usa toques nativos (page.touchscreen.tap). Os gestos de arrasto, segurar e
 * dois dedos não têm API nativa no WebKit do Playwright (nem new Touch()/new TouchEvent() são
 * aceitos aqui), então são eventos touchstart/touchmove/touchend com a lista de dedos preenchida —
 * o reconhecedor de gestos roda inteiro no motor JavaScript do WebKit.
 *   1. abertura por toque, sem erros, dica de som do iPhone
 *   2. motor dos poderes em WebGL; os 6 gestos (toque duplo, segurar, círculos, círculo, arrasto, dois dedos)
 *   3. toque duplo na borda (gesto de voltar do Safari) NÃO vira poder
 *   4. shader que não compila → cai sozinho no 2D e os poderes continuam
 *   5. chunk dos efeitos que não baixa → tenta de novo e cai no brilho, e o poder conta
 * Uso: npx playwright install webkit (uma vez) · node scripts/iphone.mjs [url]  →  screenshots/iphone/
 * Obs.: o WebKit do Playwright no Windows/Linux não tem Web Audio nem vibração — o teste confere que
 * a falta deles não quebra nada; o som em si só dá para conferir num iPhone de verdade (?debug=1).
 */
import { webkit, devices } from 'playwright'
import { mkdirSync } from 'node:fs'

const url = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:4175/'
const out = 'screenshots/iphone'
mkdirSync(out, { recursive: true })
const { defaultBrowserType, ...iphone } = devices['iPhone 13'] // eslint-disable-line no-unused-vars
const b = await webkit.launch()
const res = []
const check = (nome, ok, extra = '') => {
  res.push(ok)
  console.log(`${ok ? 'OK     ' : 'FALHOU '} ${nome}${extra ? ` (${extra})` : ''}`)
}

async function abrir(q, prep) {
  // escala 2x (em vez de 3x): o WebKit de teste desenha por software; o resto é o iPhone 13
  const ctx = await b.newContext({ ...iphone, deviceScaleFactor: 2, locale: 'pt-BR' })
  const p = await ctx.newPage()
  p.erros = []
  p.on('pageerror', (e) => p.erros.push(e.message))
  if (prep) await prep(p)
  await p.goto(url + q)
  if (q.includes('abrir=1')) await p.waitForFunction(() => window.__convite, null, { timeout: 20000 })
  // helpers de toque dentro da página
  await p.evaluate(() => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms))
    // relógio virtual: o reconhecedor mede a velocidade pelo event.timeStamp; com a página lenta
    // (WebKit por software numa máquina ocupada) o tempo real estica e o gesto mudaria de sentido
    let relogio = performance.now()
    const passo = async (ms) => {
      relogio += ms
      await wait(ms)
    }
    // cada gesto começa no relógio real; dentro dele, o tempo anda só pelo passo()
    const inicio = () => (relogio = Math.max(relogio, performance.now()))
    const ev = (tipo, pts, mudados) => {
      const alvo = document.elementFromPoint(pts[0]?.x ?? mudados[0].x, pts[0]?.y ?? mudados[0].y) ?? document.body
      const mk = (q) => ({ identifier: q.id ?? 0, target: alvo, clientX: q.x, clientY: q.y, pageX: q.x, pageY: q.y + scrollY })
      const e = new Event(tipo, { bubbles: true, cancelable: true, composed: true })
      Object.defineProperties(e, { touches: { value: pts.map(mk) }, targetTouches: { value: pts.map(mk) }, changedTouches: { value: mudados.map(mk) }, timeStamp: { value: relogio } })
      alvo.dispatchEvent(e)
    }
    window.__dedo = {
      async tracar(caminho, ms) {
        inicio()
        ev('touchstart', [caminho[0]], [caminho[0]])
        for (let i = 1; i < caminho.length; i++) {
          await passo(ms / caminho.length)
          ev('touchmove', [caminho[i]], [caminho[i]])
        }
        const u = caminho[caminho.length - 1]
        ev('touchend', [], [u])
      },
      async toqueDuplo(x, y) {
        inicio()
        for (let k = 0; k < 2; k++) {
          ev('touchstart', [{ x, y }], [{ x, y }])
          await passo(60)
          ev('touchend', [], [{ x, y }])
          await passo(110)
        }
      },
      async segurar(x, y, ms) {
        inicio()
        ev('touchstart', [{ x, y }], [{ x, y }])
        await passo(ms)
        ev('touchend', [], [{ x, y }])
      },
      async doisDedos(x, y, ms) {
        inicio()
        const a = { x: x - 30, y, id: 0 }
        const c = { x: x + 30, y, id: 1 }
        ev('touchstart', [a], [a])
        await passo(20)
        ev('touchstart', [a, c], [c])
        await passo(ms)
        ev('touchend', [a], [c])
        ev('touchend', [], [a])
      },
      circulo(cx, cy, r, voltas, n = 48) {
        const pts = []
        for (let i = 0; i <= n; i++) {
          const a = -Math.PI / 2 + (i / n) * voltas * Math.PI * 2
          pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r })
        }
        return pts
      },
    }
  })
  return { p, ctx }
}
const tem = (p, id) => p.evaluate((id) => window.__convite.poderes.tem(id), id)
const livre = (p) =>
  p.waitForFunction(async () => {
    const m = await window.__convite.carregarMotor()
    return !m || !m.ocupado()
  }, null, { timeout: 15000 })
/** espera a página ficar livre: 600 ms seguidos sem quadro travado (> 120 ms). O WebKit de teste
 *  desenha por software e compila os shaders devagar; com a página travada, um toque vira "segurar". */
const calmo = (p) =>
  p.evaluate(
    () =>
      new Promise((ok) => {
        let ult = performance.now()
        let desde = ult
        const t0 = ult
        const q = (agora) => {
          if (agora - ult > 120) desde = agora
          ult = agora
          if (agora - desde > 600 || agora - t0 > 20000) ok(agora - t0)
          else requestAnimationFrame(q)
        }
        requestAnimationFrame(q)
      }),
  )
const painel = (p) => p.evaluate(() => document.querySelector('.painel-diag')?.innerText.replace(/\n/g, ' · ') ?? '(sem painel)')

// 1) abertura por toque
{
  const { p, ctx } = await abrir('?teste=1&debug=1&modo=normal')
  await p.waitForTimeout(1200)
  await p.touchscreen.tap(195, 420)
  const sumiu = await p.waitForSelector('#intro', { state: 'detached', timeout: 20000 }).then(() => true, () => false)
  check('abertura some com o toque (WebKit)', sumiu)
  const dica = await p.waitForSelector('.dica-som.on', { timeout: 8000 }).then(() => true, () => false)
  check('dica "Ative o som do iPhone" aparece', dica)
  await p.screenshot({ path: `${out}/1-abertura-dica.png` })
  const css = await p.evaluate(() => ({ pinch: CSS.supports('touch-action', 'pan-y pinch-zoom'), html: getComputedStyle(document.documentElement).touchAction }))
  check('touch-action do html sem zoom de toque duplo', /pan-y|manipulation/.test(css.html), `"pan-y pinch-zoom" aceito: ${css.pinch} · valor: ${css.html}`)
  check('sem erros de página (sem Web Audio/vibração no WebKit de teste)', p.erros.length === 0, p.erros.join(' | '))
  console.log('   painel:', await painel(p))
  await ctx.close()
}

// 2) os 6 gestos com o motor WebGL
{
  const { p, ctx } = await abrir('?abrir=1&teste=1&debug=1&modo=normal')
  await p.waitForTimeout(1500)
  const tipo = await p.evaluate(async () => (await window.__convite.carregarMotor())?.tipo())
  check('motor dos poderes no WebKit', tipo === 'webgl', tipo)
  // gestos mais abaixo no convite (o céu do hero pausa fora da tela) e depois do aquecimento dos shaders
  await p.evaluate(() => scrollTo(0, document.getElementById('missao').offsetTop - 40))
  await p.waitForTimeout(4000)
  const W = 390
  const gestos = [
    ['impacto', 'toque duplo', () => p.evaluate(() => window.__dedo.toqueDuplo(195, 470))],
    ['rajada', 'segurar e soltar', () => p.evaluate(() => window.__dedo.segurar(195, 470, 1600))],
    ['magia', 'girar em círculos', () => p.evaluate(() => window.__dedo.tracar(window.__dedo.circulo(195, 450, 60, 2.6, 90), 1600))],
    ['portal', 'um círculo fechado', () => p.evaluate(() => window.__dedo.tracar(window.__dedo.circulo(195, 450, 80, 1.05, 40), 650))],
    ['tempestade', 'arrasto rápido para baixo', () => p.evaluate(() => window.__dedo.tracar(Array.from({ length: 12 }, (_, i) => ({ x: 200, y: 140 + i * 26 })), 220))],
    ['cosmico', 'dois dedos', () => p.evaluate(() => window.__dedo.doisDedos(195, 470, 1500))],
  ]
  // o WebKit de teste às vezes trava a página por centenas de ms (render por software): cada gesto
  // tem até 3 tentativas, sempre com a página livre antes; o resultado diz quantas foram precisas
  const rotulo = { impacto: 'impacto', rajada: 'rajada', magia: 'magia', portal: 'portal', tempestade: 'tempestade', cosmico: 'cósmica' }
  for (const [id, nome, fazer] of gestos) {
    await livre(p)
    await calmo(p)
    await fazer()
    await p.waitForTimeout(350)
    await p.screenshot({ path: `${out}/2-${id}.png` }).catch(() => {})
    await p.waitForTimeout(900)
    const ult = (await painel(p)).match(/último gesto ([^·]*)/)?.[1]?.trim() ?? ''
    check(`gesto ${nome} → ${id}`, ult.includes(rotulo[id]), `reconhecido: ${ult} · poder contou: ${(await tem(p, id)) ? 'sim' : 'não (página lenta demais para carregar)'}`)
  }
  // entrega de toques NATIVOS do WebKit (page.touchscreen): o toque duplo de verdade (o último
  // gesto reconhecido antes deste é "dois dedos", então o painel só diz "toque duplo" se este passou)
  {
    let n = 0
    let ok = false
    while (n < 3 && !ok) {
      n++
      await livre(p)
      await calmo(p)
      await p.touchscreen.tap(195, 470)
      await p.touchscreen.tap(195, 470)
      await p.waitForTimeout(700)
      ok = (await painel(p)).includes('toque duplo')
    }
    check('toque duplo com toques nativos do WebKit', ok, `${n} tentativa(s)`)
  }
  check('sem erros de página durante os poderes', p.erros.length === 0, p.erros.join(' | '))
  await p.screenshot({ path: `${out}/2-painel.png` })
  console.log('   painel:', await painel(p))
  void W
  await ctx.close()
}

// 3) toque duplo na borda: é o gesto de voltar do Safari, não um poder
{
  const { p, ctx } = await abrir('?abrir=1&teste=1&modo=normal')
  await p.waitForTimeout(1500)
  await p.evaluate(() => window.__dedo.toqueDuplo(8, 470))
  await p.waitForTimeout(900)
  check('toque na borda (gesto de voltar do Safari) não vira poder', !(await tem(p, 'impacto')))
  await ctx.close()
}

// 4) shader que não compila → 2D automático
{
  const { p, ctx } = await abrir('?abrir=1&teste=1&debug=1&modo=normal', (p) =>
    p.addInitScript(() => {
      const orig = WebGLRenderingContext.prototype.getShaderParameter
      WebGLRenderingContext.prototype.getShaderParameter = function (s, k) {
        return k === this.COMPILE_STATUS ? false : orig.call(this, s, k)
      }
    }),
  )
  await p.waitForTimeout(1500)
  const tipo = await p.evaluate(async () => (await window.__convite.carregarMotor())?.tipo())
  check('shader quebrado → motor cai no 2D', tipo === '2d', tipo)
  await p.evaluate(() => window.__dedo.toqueDuplo(195, 470))
  await p.waitForTimeout(500)
  await p.screenshot({ path: `${out}/4-fallback-2d.png` })
  check('…e o poder funciona no 2D', await tem(p, 'impacto'))
  check('sem erros de página', p.erros.length === 0, p.erros.join(' | '))
  console.log('   painel:', await painel(p))
  await ctx.close()
}

// 5) chunks dos efeitos que não baixam (rede ruim)
const comFalha = (re, quantas) => {
  const log = []
  return {
    log,
    prep: (p) =>
      p.route(re, (r) => {
        log.push(r.request().url().split('/').pop())
        return log.length <= quantas ? r.abort() : r.continue()
      }),
  }
}
const carregar = (p) => p.evaluate(async () => (await window.__convite.carregarMotor())?.tipo() ?? 'sem motor')
{
  // 5a) o motor falha uma vez → a 2ª tentativa vai à rede por outro endereço e funciona
  const f = comFalha(/motor-[^/]*[.]js/, 1)
  const { p, ctx } = await abrir('?abrir=1&teste=1&debug=1&modo=normal', f.prep)
  const tipo = await carregar(p)
  check('chunk do motor falha 1x → nova tentativa por outro endereço funciona', tipo === 'webgl' && f.log.length === 2, `${tipo} · ${f.log.join(', ')}`)
  await ctx.close()
}
{
  // 5b) o chunk WebGL nunca baixa → motor em 2D, poder funciona
  const f = comFalha(/efeitos-gl-[^/]*[.]js/, 99)
  const { p, ctx } = await abrir('?abrir=1&teste=1&debug=1&modo=normal', f.prep)
  const tipo = await carregar(p)
  await p.evaluate(() => window.__dedo.toqueDuplo(195, 470))
  await p.waitForTimeout(600)
  check('chunk WebGL nunca baixa → 3 tentativas e motor em 2D', tipo === '2d' && f.log.length === 3, `${tipo} · ${f.log.length} pedidos`)
  check('…e o poder funciona no 2D', await tem(p, 'impacto'))
  await ctx.close()
}
{
  // 5c) o motor nunca baixa → 3 tentativas e brilho suave (o poder conta)
  const f = comFalha(/motor-[^/]*[.]js/, 99)
  const { p, ctx } = await abrir('?abrir=1&teste=1&debug=1&modo=normal', f.prep)
  const tipo = await carregar(p)
  await p.evaluate(() => window.__dedo.toqueDuplo(195, 470))
  await p.waitForTimeout(600)
  check('chunk do motor nunca baixa → 3 tentativas', tipo === 'sem motor' && f.log.length === 3, `${f.log.length} pedidos`)
  check('…e o poder vira brilho e conta', await tem(p, 'impacto'))
  await p.screenshot({ path: `${out}/5-sem-motor-painel.png` })
  console.log('   painel:', await painel(p))
  await ctx.close()
}

await b.close()
const falhas = res.filter((r) => !r).length
console.log(falhas ? `\n${falhas} FALHA(S)` : `\nTUDO OK (${res.length})`)
process.exit(falhas ? 1 : 0)
