/**
 * Renderizador WebGL dos poderes (chunk separado do motor): se este arquivo não baixar ou o WebGL
 * falhar, o motor segue com o canvas 2D (render2d.ts).
 */
import { VS_TELA, programa, telaCheia, type GL, type Prog } from './base'
import { Render } from './render'
import { FS_CHOQUE, FS_FEIXE, FS_NEVOA, FS_PORTAL, FS_TEMPESTADE } from './shaders'
import type { Quadro } from '../sim'

export { resetQuad } from './base'
export type { GL } from './base'

export class RenderGL {
  r: Render
  p: Partial<Record<'temp' | 'choque' | 'feixe' | 'nevoa' | 'portal', Prog>> = {}
  /** erro no aquecimento (shader que não compila): o próximo quadro joga o erro e o motor vai para o 2D */
  quebrado: unknown = null
  constructor(public gl: GL) {
    this.r = new Render(gl)
    // os programas grandes compilam aos poucos, quando o celular estiver livre (sem travar)
    const fila: (keyof RenderGL['p'])[] = ['choque', 'temp', 'feixe', 'portal', 'nevoa']
    // e cada um é "aquecido" com um desenho de 1 pixel: muitos drivers (ANGLE/D3D no Windows, alguns
    // celulares) só compilam de verdade no primeiro desenho — assim o primeiro poder não trava
    const prox = () => {
      if (this.quebrado) return
      const k = fila.shift()
      try {
        if (!k) return this.aquecerBase()
        const p = this.prog(k)
        if (this.r.cena) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, this.r.cena.fb)
          gl.viewport(0, 0, 1, 1)
          gl.useProgram(p.p)
          telaCheia(gl, p)
          this.limpar()
        }
      } catch (e) {
        this.quebrado = e
        return
      }
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
  /** Um quadro invisível passando por linhas, partículas, bloom e composição (aquece o resto). */
  aquecerBase() {
    if (!this.r.cena) return
    const part = { x: 0, y: 0, vx: 0, vy: 0, g: 0, atrito: 0, vida: 0, max: 1, tam0: 1, tam1: 1, cor: [0, 0, 0] as [number, number, number], a0: 0, a1: 0, tipo: 0, seed: 0, aditiva: true }
    const linha = { pts: [{ x: 0, y: 0 }, { x: 1, y: 1 }], larg: 1, halo: [0, 0, 0] as [number, number, number], nucleo: [0, 0, 0] as [number, number, number], nucLarg: 1, alfa: 0 }
    this.desenhar({ t: 0, shake: [0, 0], linhas: [linha], escuras: [{ ...linha, escura: true }], luz: [part], sobre: [{ ...part, aditiva: false }], tempestade: null, ondas: [], poco: null, feixe: null, nevoa: null, portal: null, lente: [0, 0, 0, 0], calor: [0, 0, 0, 0, 0, 0], ativo: false })
    this.limpar()
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
    if (this.quebrado) throw this.quebrado
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
