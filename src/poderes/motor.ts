/**
 * Motor dos poderes (chunk separado, carregado só perto da seção PODERES ou no primeiro gesto).
 * WebGL puro: shaders de tela cheia (tempestade, choque, feixe, névoa, portal) + linhas com brilho +
 * partículas, bloom e composição com distorção (refração das ondas, lente do portal, ar ondulando de
 * calor). Sem WebGL, ou se o aparelho não aguentar (FPS baixo), cai para o canvas 2D (render2d.ts).
 * Um canvas fixo por cima do convite, sem pegar toques. O loop só roda enquanto há efeito vivo e
 * para com a aba em segundo plano. Enquanto roda, os efeitos de fundo do hero ficam pausados.
 */
import { VS_TELA, programa, resetQuad, telaCheia, type GL, type Prog } from './gl/base'
import { Render } from './gl/render'
import { FS_CHOQUE, FS_FEIXE, FS_NEVOA, FS_PORTAL, FS_TEMPESTADE } from './gl/shaders'
import { Render2D } from './render2d'
import { Sim, type Quadro } from './sim'
import { cartoesVisiveis, iluminar, levitar, ondular, puxar, tremer } from './cartoes'
import { infoPoder, type PoderId } from './catalogo'
import type { Pt } from '../lib/fx/raio'
import { fx2d } from '../lib/fx/camada2d'
import { fundo } from '../lib/fx/fundo'
import { perf } from '../lib/perf'
import { debug } from '../lib/debug'
import { sfx } from '../lib/sfx'
import { vibrate } from '../lib/haptics'

const MAX_GL = 300
const MAX_2D = 120

/* ---------------- renderizador WebGL ---------------- */
class RenderGL {
  r: Render
  p: Partial<Record<'temp' | 'choque' | 'feixe' | 'nevoa' | 'portal', Prog>> = {}
  constructor(public gl: GL) {
    this.r = new Render(gl)
    // os programas grandes compilam aos poucos, quando o celular estiver livre (sem travar)
    const fila: (keyof RenderGL['p'])[] = ['choque', 'temp', 'feixe', 'portal', 'nevoa']
    const prox = () => {
      const k = fila.shift()
      if (!k) return
      this.prog(k)
      if ('requestIdleCallback' in window) requestIdleCallback(prox, { timeout: 1500 })
      else setTimeout(prox, 60)
    }
    setTimeout(prox, 50)
  }
  prog(k: keyof RenderGL['p']): Prog {
    const gl = this.gl
    if (this.p[k]) return this.p[k]!
    const u = {
      temp: [FS_TEMPESTADE, ['uRes', 'uTempo', 'uAlfa', 'uLuz', 'uLuzPos', 'uMarca']],
      choque: [FS_CHOQUE, ['uRes', 'uTempo', 'uOnd', 'uOndCor', 'uPoco']],
      feixe: [FS_FEIXE, ['uRes', 'uTempo', 'uA', 'uB', 'uLarg', 'uForca', 'uAlcance', 'uCarga']],
      nevoa: [FS_NEVOA, ['uRes', 'uTempo', 'uPts', 'uN', 'uAlfa']],
      portal: [FS_PORTAL, ['uRes', 'uTempo', 'uC', 'uR', 'uAbre']],
    } as const
    const [fs, us] = u[k]
    this.p[k] = programa(gl, VS_TELA, fs, [...us])
    return this.p[k]!
  }
  redimensionar(W: number, H: number, dpr: number) {
    this.r.redimensionar(W, H, dpr)
  }
  limpar() {
    const gl = this.gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
  }
  desenhar(q: Quadro) {
    const { gl, r } = this
    const W = r.W
    const H = r.H
    const t = q.t
    const usar = (k: keyof RenderGL['p']) => {
      const p = this.prog(k)
      gl.useProgram(p.p)
      gl.uniform2f(p.u.uRes, W, H)
      gl.uniform1f(p.u.uTempo, t)
      return p
    }
    r.iniciarCena()
    r.sobre()
    if (q.tempestade) {
      const p = usar('temp')
      gl.uniform1f(p.u.uAlfa, q.tempestade.alfa)
      gl.uniform1f(p.u.uLuz, q.tempestade.luz)
      gl.uniform2f(p.u.uLuzPos, q.tempestade.luzPos.x, q.tempestade.luzPos.y)
      gl.uniform4fv(p.u.uMarca, q.tempestade.marca)
      telaCheia(gl, p)
    }
    if (q.nevoa && q.nevoa.pts.length) {
      const p = usar('nevoa')
      const a = new Float32Array(24 * 3)
      q.nevoa.pts.slice(-24).forEach((pt, i) => a.set(pt, i * 3))
      gl.uniform3fv(p.u.uPts, a)
      gl.uniform1f(p.u.uN, Math.min(24, q.nevoa.pts.length))
      gl.uniform1f(p.u.uAlfa, q.nevoa.alfa)
      telaCheia(gl, p)
    }
    if (q.portal && q.portal.abre > 0.01) {
      const p = usar('portal')
      gl.uniform2f(p.u.uC, q.portal.c.x, q.portal.c.y)
      gl.uniform1f(p.u.uR, q.portal.r)
      gl.uniform1f(p.u.uAbre, q.portal.abre)
      telaCheia(gl, p)
    }
    r.linhas(q.escuras, q.shake)
    r.particulas(q.sobre, q.shake)
    r.luz()
    if (q.ondas.length || q.poco) {
      const p = usar('choque')
      const o = new Float32Array(16)
      const c = new Float32Array(12)
      q.ondas.slice(-4).forEach((w, i) => {
        o.set([w.x + q.shake[0], w.y + q.shake[1], w.r, w.forca], i * 4)
        c.set(w.cor, i * 3)
      })
      gl.uniform4fv(p.u.uOnd, o)
      gl.uniform3fv(p.u.uOndCor, c)
      gl.uniform4fv(p.u.uPoco, q.poco ? [q.poco[0] + q.shake[0], q.poco[1] + q.shake[1], q.poco[2], q.poco[3]] : [0, 0, 0, 0])
      telaCheia(gl, p)
    }
    if (q.feixe) {
      const p = usar('feixe')
      const f = q.feixe
      gl.uniform2f(p.u.uA, f.a.x, f.a.y)
      gl.uniform2f(p.u.uB, f.b.x, f.b.y)
      gl.uniform1f(p.u.uLarg, f.larg)
      gl.uniform1f(p.u.uForca, f.forca)
      gl.uniform1f(p.u.uAlcance, f.alcance)
      gl.uniform1f(p.u.uCarga, f.carga)
      telaCheia(gl, p)
    }
    r.linhas(q.linhas, q.shake)
    r.particulas(q.luz, q.shake)
    r.bloom()
    const ondas = new Array(16).fill(0)
    q.ondas.slice(-4).forEach((w, i) => ondas.splice(i * 4, 4, w.x, w.y, w.r, w.forca * 0.9))
    r.compor(t, ondas, q.lente, [q.calor[0], q.calor[1], q.calor[2], q.calor[3]], [0, 0, q.calor[4], q.calor[5]], 1.1)
  }
}

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

export function criarMotor(aoAtivar: (id: PoderId) => void): Motor {
  const canvas = document.createElement('canvas')
  canvas.className = 'fx-gl'
  canvas.setAttribute('aria-hidden', 'true')
  document.body.append(canvas)

  let gl: GL | null = null
  if (debug.motor !== '2d' && perf.temWebgl() && !(perf.isLite() && debug.modo === 'leve')) {
    gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' }) as GL | null
  }
  let rgl: RenderGL | null = null
  let r2d: Render2D | null = null
  if (gl) {
    try {
      rgl = new RenderGL(gl)
    } catch (e) {
      console.info('[convite] WebGL falhou, usando 2D', e)
      rgl = null
    }
  }
  const usar2D = () => {
    if (r2d) return
    rgl = null
    // um canvas que já teve WebGL não aceita 2D: troca o elemento
    const c2 = document.createElement('canvas')
    c2.className = 'fx-gl'
    c2.setAttribute('aria-hidden', 'true')
    canvas.replaceWith(c2)
    r2d = new Render2D(c2)
    sim.maxPart = MAX_2D
    resize()
  }
  const sim = new Sim(rgl ? MAX_GL : MAX_2D)
  if (!rgl) {
    r2d = new Render2D(canvas)
  }
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault()
    resetQuad()
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
    if (rgl) rgl.desenhar(q)
    else r2d!.desenhar(q)
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
