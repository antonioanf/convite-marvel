/**
 * Motor dos poderes (chunk separado, carregado só perto da seção PODERES ou no primeiro gesto).
 * WebGL puro: shaders de tela cheia (tempestade, choque, feixe, névoa, portal) + linhas com brilho +
 * partículas, bloom e composição com distorção (refração das ondas, lente do portal, ar ondulando de
 * calor). Sem WebGL, ou se o aparelho não aguentar (FPS baixo), cai para o canvas 2D (render2d.ts).
 * Um canvas fixo por cima do convite, sem pegar toques. O loop só roda enquanto há efeito vivo e
 * para com a aba em segundo plano. Enquanto roda, os efeitos de fundo do hero ficam pausados.
 */
import type { GL, RenderGL } from './gl/renderGL'
import { Render2D } from './render2d'
import { Sim } from './sim'
import { cartoesVisiveis, iluminar, levitar, ondular, puxar, tremer } from './cartoes'
import { infoPoder, type PoderId } from './catalogo'
import type { Pt } from '../lib/fx/raio'
import { fx2d } from '../lib/fx/camada2d'
import { fundo } from '../lib/fx/fundo'
import { perf } from '../lib/perf'
import { debug } from '../lib/debug'
import { diag } from '../lib/diag'
import { importarComRetry } from '../lib/chunks'
import { sfx } from '../lib/sfx'
import { vibrate } from '../lib/haptics'

const MAX_GL = 300
const MAX_2D = 120


export interface Motor {
  tipo: () => 'webgl' | '2d'
  tempestade(alvo: Pt): void
  impacto(p: Pt): void
  carga(p: Pt): void
  cargaMover(p: Pt): void
  /** solta a carga: 'rajada' (feixe), 'cosmico' (segurou bem longo) ou null (soltou cedo demais) */
  cargaSoltar(): 'rajada' | 'cosmico' | null
  cargaCancelar(): void
  magia(p: Pt): void
  magiaFim(): void
  portal(c: Pt, r: number, contar?: boolean): void
  cosmico(c: Pt): void
  cosmicoMover(c: Pt): void
  /** `contar: false` = efeito decorativo (o dia da festa), não conta como poder ativado */
  cosmicoSoltar(contar?: boolean): void
  /** sequência completa de um poder (botão "Disparar" e sobrecarga) */
  demo(id: PoderId, centro?: Pt): Promise<void>
  ocupado(): boolean
}

export async function criarMotor(aoAtivar: (id: PoderId) => void): Promise<Motor> {
  const novoCanvas = () => {
    const c = document.createElement('canvas')
    c.className = 'fx-gl'
    c.setAttribute('aria-hidden', 'true')
    return c
  }
  // o renderizador WebGL é outro chunk: se não baixar (mesmo depois das novas tentativas), fica o 2D
  let glMod: typeof import('./gl/renderGL') | null = null
  if (debug.motor !== '2d' && perf.temWebgl() && !(perf.isLite() && debug.modo === 'leve')) {
    try {
      glMod = await importarComRetry('efeitos-gl', () => import('./gl/renderGL'))
    } catch (e) {
      diag.erro('chunk webgl', e)
    }
  }

  let canvas = novoCanvas()
  document.body.append(canvas)

  let gl: GL | null = null
  if (glMod) {
    try {
      gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' }) as GL | null
    } catch (e) {
      diag.erro('webgl', e)
    }
  }
  let rgl: RenderGL | null = null
  let r2d: Render2D | null = null
  if (gl && glMod) {
    try {
      rgl = new glMod.RenderGL(gl)
      if (gl.isContextLost()) throw new Error('contexto perdido ao iniciar')
    } catch (e) {
      // shader que não compila (ex.: iOS antigo), framebuffer incompleto etc. → 2D
      console.info('[convite] WebGL falhou, usando 2D', e)
      diag.erro('webgl', e)
      rgl = null
    }
  }
  // um canvas que já teve WebGL não aceita 2D (getContext('2d') devolve null): troca o elemento
  const canvas2D = () => {
    if (!gl) return canvas
    const c2 = novoCanvas()
    canvas.replaceWith(c2)
    canvas = c2
    return c2
  }
  const usar2D = () => {
    if (r2d) return
    rgl = null
    r2d = new Render2D(canvas2D())
    sim.maxPart = MAX_2D
    diag.setMotor('2d')
    resize()
  }
  const sim = new Sim(rgl ? MAX_GL : MAX_2D)
  if (!rgl) r2d = new Render2D(canvas2D())
  diag.setMotor(rgl ? 'webgl' : '2d')
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault()
    diag.erro('webgl', 'contexto perdido')
    glMod?.resetQuad()
    usar2D()
  })

  let W = 0
  let H = 0
  function resize() {
    W = innerWidth
    H = innerHeight
    sim.W = W
    sim.H = H
    if (rgl) {
      const dpr = Math.min(perf.isLite() ? 1 : 1.25, devicePixelRatio || 1)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      rgl.r.escalaCena = perf.isLite() ? 0.6 : 0.72
      rgl.redimensionar(W, H, dpr)
    } else r2d?.redimensionar(W, H, Math.min(perf.isLite() ? 1 : 1.5, devicePixelRatio || 1))
  }
  resize()
  addEventListener('resize', resize, { passive: true })

  /* ---------- loop ---------- */
  let raf = 0
  let ultimo = 0
  let soltarFundo: (() => void) | null = null
  // medidor: se o motor WebGL ficar abaixo de ~28 fps no aparelho, os próximos quadros vão para o 2D
  let med = { n: 0, soma: 0 }
  const quadro = (now: number) => {
    raf = 0
    if (document.hidden) return
    const dt = Math.min(0.05, (now - ultimo) / 1000 || 0.016)
    ultimo = now
    if (rgl && debug.modo !== 'normal' && med.n < 40) {
      med.n++
      med.soma += dt
      if (med.n === 40 && med.soma / 40 > 1 / 28) {
        console.info(`[convite] poderes a ${(40 / med.soma).toFixed(0)} fps no WebGL: usando 2D`)
        usar2D()
      }
    }
    sim.passo(dt)
    const q = sim.quadro()
    if (rgl) {
      try {
        rgl.desenhar(q)
      } catch (e) {
        // erro do WebGL no meio do efeito: os próximos quadros vão para o 2D
        diag.erro('webgl desenho', e)
        usar2D()
      }
    }
    if (!rgl) r2d!.desenhar(q)
    if (q.ativo) raf = requestAnimationFrame(quadro)
    else {
      if (rgl) rgl.limpar()
      else r2d!.limpar()
      soltarFundo?.()
      soltarFundo = null
    }
  }
  const acordar = () => {
    if (!soltarFundo) soltarFundo = fundo.pausar()
    if (raf || document.hidden) return
    ultimo = performance.now()
    raf = requestAnimationFrame(quadro)
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf)
      raf = 0
    } else if (sim.vivo()) acordar()
  })

  /* ---------- poderes ---------- */
  const clarao = (id: PoderId, forca: number, y = 30) => fx2d.clarao(forca, infoPoder(id).rgb, y)
  let pararCarga: (() => void) | null = null
  let tCarga = 0
  let vibCarga = 0
  let vibCosmico = 0
  let magiaAtiva = false
  let somMagia = 0
  let cosmicoAtivo = false

  const m: Motor = {
    tipo: () => (rgl ? 'webgl' : '2d'),
    ocupado: () => sim.vivo(),

    tempestade(alvo) {
      sim.bordas = cartoesVisiveis(4).map((c) => c.r)
      sim.iniciarTempestade(alvo)
      acordar()
      aoAtivar('tempestade')
      // o raio cai ~0,28 s depois do céu fechar
      setTimeout(() => {
        clarao('tempestade', 0.9, Math.round((alvo.y / H) * 60))
        iluminar('120 190 255', 280)
        sfx.trovao(1)
        vibrate([50, 30, 90])
        tremer(7, 420)
      }, 280)
      setTimeout(() => sfx.estalo(0.35), 650)
      setTimeout(() => {
        clarao('tempestade', 0.5)
        sfx.estalo(0.5)
        vibrate(30)
      }, 1150)
    },

    impacto(p) {
      sim.iniciarImpacto(p)
      acordar()
      aoAtivar('impacto')
      clarao('impacto', 0.75, Math.round((p.y / H) * 100))
      sfx.impacto(1)
      vibrate([70, 30, 140])
      tremer(16, 700)
      ondular(p, 1000, 14)
    },

    carga(p) {
      sim.iniciarCarga(p)
      acordar()
      tCarga = performance.now()
      pararCarga?.()
      pararCarga = sfx.carga(1.2)
      clearInterval(vibCarga)
      vibCarga = window.setInterval(() => vibrate(8), 220)
    },
    cargaMover(p) {
      sim.moverCarga(p)
    },
    cargaCancelar() {
      sim.cancelarCarga()
      pararCarga?.()
      pararCarga = null
      clearInterval(vibCarga)
    },
    cargaSoltar() {
      clearInterval(vibCarga)
      pararCarga?.()
      pararCarga = null
      const f = sim.feixe
      if (!f || f.fase !== 'carga') return null
      // segurou bem longo: a energia passa do ponto e vira energia cósmica
      if (performance.now() - tCarga > 2600) {
        const c = f.a
        sim.cancelarCarga()
        m.cosmico(c)
        setTimeout(() => m.cosmicoSoltar(), 60)
        return 'cosmico'
      }
      const carga = sim.disparar()
      if (!carga) return null
      aoAtivar('rajada')
      sfx.disparo()
      clarao('rajada', 0.35 + 0.3 * carga, Math.round((f.a.y / H) * 100))
      vibrate([30, 20, 80])
      tremer(5 + 5 * carga, 380)
      const fx = sim.feixe
      if (fx) ondular({ x: (fx.a.x + fx.b.x) / 2, y: (fx.a.y + fx.b.y) / 2 }, 1600, 6)
      return 'rajada'
    },

    magia(p) {
      sim.alimentarNevoa(p)
      acordar()
      if (!magiaAtiva) {
        magiaAtiva = true
        aoAtivar('magia')
        levitar(true)
        sfx.magia()
        somMagia = window.setInterval(() => sfx.magia(), 1500)
        vibrate(12)
      }
    },
    magiaFim() {
      if (!magiaAtiva) return
      magiaAtiva = false
      sim.fimNevoa()
      clearInterval(somMagia)
      setTimeout(() => levitar(false), 400)
    },

    portal(c, r, contar = true) {
      sim.iniciarPortal(c, r)
      acordar()
      if (contar) aoAtivar('portal')
      sfx.portal()
      vibrate([20, 40, 20, 40, 60])
      clarao('portal', 0.35, Math.round((c.y / H) * 100))
      const pt = sim.portal!
      puxar(pt.c, pt.r, pt.dur * 1000)
    },

    cosmico(c) {
      if (cosmicoAtivo) return
      cosmicoAtivo = true
      sim.iniciarCosmico(c)
      acordar()
      sfx.cosmicoCarga(1.4)
      clearInterval(vibCosmico)
      vibCosmico = window.setInterval(() => vibrate(6), 260)
    },
    cosmicoMover(c) {
      sim.moverCosmico(c)
    },
    cosmicoSoltar(contar = true) {
      if (!cosmicoAtivo) return
      cosmicoAtivo = false
      clearInterval(vibCosmico)
      const k = sim.cosmico
      if (!k) return
      sim.explodirCosmico()
      if (contar) aoAtivar('cosmico')
      sfx.cosmicoExplosao()
      clarao('cosmico', 0.85, Math.round((k.c.y / H) * 100))
      iluminar('245 183 0', 320)
      vibrate([40, 30, 120])
      tremer(10, 600)
      ondular(k.c, 1100, 12)
    },

    async demo(id, centro) {
      const c = centro ?? { x: W / 2, y: H * 0.42 }
      const espera = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
      switch (id) {
        case 'tempestade':
          m.tempestade({ x: c.x + (Math.random() - 0.5) * W * 0.3, y: c.y + H * 0.12 })
          return espera(2600)
        case 'impacto':
          m.impacto({ x: c.x, y: c.y + H * 0.08 })
          return espera(1800)
        case 'rajada':
          m.carga({ x: c.x + (Math.random() - 0.5) * 60, y: c.y + H * 0.22 })
          await espera(1000)
          m.cargaSoltar()
          return espera(1100)
        case 'magia': {
          const t0 = performance.now()
          await new Promise<void>((ok) => {
            const id2 = setInterval(() => {
              const k = (performance.now() - t0) / 1000
              const a = k * Math.PI * 2 * 0.9
              m.magia({ x: c.x + Math.cos(a) * 80, y: c.y + Math.sin(a) * 60 })
              if (k > 2.4) {
                clearInterval(id2)
                m.magiaFim()
                ok()
              }
            }, 30)
          })
          return espera(1200)
        }
        case 'portal':
          m.portal(c, Math.min(W, H) * 0.3)
          return espera(3600)
        case 'cosmico':
          m.cosmico(c)
          await espera(1500)
          m.cosmicoSoltar()
          return espera(1400)
      }
    },
  }
  return m
}
