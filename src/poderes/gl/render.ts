/**
 * Renderizadores do motor: linhas com brilho (raios, rachaduras, fiapos), partículas (brilhos, pedras,
 * fumaça, estrelas), bloom e a composição final com distorção (ondas de choque, lente do portal, calor).
 * Coordenadas em px CSS, origem no canto superior esquerdo.
 */
import { GLSL_RUIDO, VS_TELA, alvo, apagarAlvo, programa, telaCheia, type Alvo, type GL, type Prog } from './base'

/* ---------------- linhas ---------------- */
const VS_LINHA = `
attribute vec2 aPos; attribute float aLado; attribute vec4 aCor; attribute vec4 aNuc;
uniform vec2 uRes; uniform vec2 uShake;
varying float vLado; varying vec4 vCor; varying vec4 vNuc;
void main() {
  vLado = aLado; vCor = aCor; vNuc = aNuc;
  vec2 p = (aPos + uShake) / uRes * 2.0 - 1.0;
  gl_Position = vec4(p.x, -p.y, 0.0, 1.0);
}`
// vCor = halo (rgb) + alfa; vNuc = núcleo (rgb) + fração do núcleo na largura; modo escuro quando vNuc.a < 0
const FS_LINHA = `
varying float vLado; varying vec4 vCor; varying vec4 vNuc;
void main() {
  float k = 1.0 - abs(vLado);
  if (vNuc.a < 0.0) { // fissura escura (mistura alfa)
    float a = smoothstep(0.0, 0.6, k) * vCor.a;
    gl_FragColor = vec4(vCor.rgb * a, a);
    return;
  }
  float r = max(vNuc.a, 0.015);
  float nucleo = exp(-pow((1.0 - k) / r, 2.0));
  float halo = pow(k, 2.2) * 0.6 + pow(k, 7.0) * 0.4;
  vec3 c = vCor.rgb * halo + vNuc.rgb * nucleo;
  gl_FragColor = vec4(c * vCor.a, 0.0);
}`

export interface Linha {
  pts: { x: number; y: number }[]
  /** meia-largura total do brilho (px) */
  larg: number
  halo: [number, number, number]
  nucleo: [number, number, number]
  /** largura do núcleo (px) */
  nucLarg: number
  alfa: number
  escura?: boolean
}

/* ---------------- partículas ---------------- */
const VS_PART = `
attribute vec2 aPos; attribute float aTam; attribute vec4 aCor; attribute vec2 aInfo;
uniform vec2 uRes; uniform vec2 uShake; uniform float uEscala;
varying vec4 vCor; varying vec2 vInfo;
void main() {
  vCor = aCor; vInfo = aInfo;
  vec2 p = (aPos + uShake) / uRes * 2.0 - 1.0;
  gl_Position = vec4(p.x, -p.y, 0.0, 1.0);
  gl_PointSize = aTam * uEscala;
}`
const FS_PART = `
${GLSL_RUIDO}
varying vec4 vCor; varying vec2 vInfo;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(q, q);
  if (r2 > 1.0) discard;
  float tipo = vInfo.x; float seed = vInfo.y;
  if (tipo < 0.5) { // brilho macio
    float i = exp(-r2 * 9.0) + 0.35 * exp(-r2 * 2.6);
    vec3 c = mix(vCor.rgb, vec3(1.0), exp(-r2 * 30.0) * 0.8);
    gl_FragColor = vec4(c * i * vCor.a, 0.0);
  } else if (tipo < 1.5) { // pedra: contorno irregular, lado de cima iluminado
    float ang = atan(q.y, q.x) + seed * 6.28;
    float raio = 0.62 + 0.22 * ruido(vec2(ang * 1.6, seed * 13.0)) + 0.1 * sin(ang * 3.0 + seed * 20.0);
    float d = length(q);
    float a = smoothstep(raio, raio - 0.12, d);
    float luz = clamp(0.55 - q.y * 0.6 - q.x * 0.2, 0.0, 1.0);
    vec3 c = vCor.rgb * (0.45 + luz * 0.9) * (0.85 + 0.3 * ruido(q * 4.0 + seed * 7.0));
    gl_FragColor = vec4(c * a * vCor.a, a * vCor.a);
  } else if (tipo < 2.5) { // fumaça/poeira: bolha macia com textura
    float n = ruido(q * 2.2 + seed * 11.0) * 0.6 + ruido(q * 5.0 - seed * 3.0) * 0.4;
    float a = pow(1.0 - sqrt(r2), 1.6) * (0.55 + n * 0.6) * vCor.a;
    gl_FragColor = vec4(vCor.rgb * a, a);
  } else { // estrela de 4 pontas com halo
    float x = abs(q.x); float y = abs(q.y);
    float raio = exp(-x * 14.0) * exp(-y * 1.8) + exp(-y * 14.0) * exp(-x * 1.8);
    float i = raio * 0.9 + exp(-r2 * 12.0) + 0.25 * exp(-r2 * 3.0);
    gl_FragColor = vec4(mix(vCor.rgb, vec3(1.0), exp(-r2 * 40.0)) * i * vCor.a, 0.0);
  }
}`

export interface Particula {
  x: number
  y: number
  vx: number
  vy: number
  /** gravidade (px/s²) */
  g: number
  /** atrito (por segundo) */
  atrito: number
  vida: number
  max: number
  tam0: number
  tam1: number
  cor: [number, number, number]
  a0: number
  a1: number
  /** 0 brilho, 1 pedra, 2 fumaça, 3 estrela */
  tipo: number
  seed: number
  /** chão para quicar (y em px) */
  chao?: number
  /** atração para um ponto (portal, carga) */
  alvo?: { x: number; y: number; forca: number; giro: number }
  aditiva: boolean
}

/* ---------------- bloom + composição ---------------- */
const FS_CLARO = `
uniform sampler2D uTex; varying vec2 vUv;
void main() {
  vec4 c = texture2D(uTex, vUv);
  float l = max(c.r, max(c.g, c.b));
  gl_FragColor = vec4(c.rgb * smoothstep(0.35, 0.95, l), 1.0);
}`
const FS_BLUR = `
uniform sampler2D uTex; uniform vec2 uDir; varying vec2 vUv;
void main() {
  vec3 c = texture2D(uTex, vUv).rgb * 0.227;
  c += texture2D(uTex, vUv + uDir * 1.38).rgb * 0.316;
  c += texture2D(uTex, vUv - uDir * 1.38).rgb * 0.316;
  c += texture2D(uTex, vUv + uDir * 3.23).rgb * 0.07;
  c += texture2D(uTex, vUv - uDir * 3.23).rgb * 0.07;
  gl_FragColor = vec4(c, 1.0);
}`
const FS_COMPOSICAO = `
${GLSL_RUIDO}
uniform sampler2D uCena; uniform sampler2D uBloom;
uniform vec2 uRes; uniform float uTempo; uniform float uBloomK;
uniform vec4 uOndas[4]; uniform vec4 uLente; uniform vec4 uCalorA; uniform vec4 uCalorB;
varying vec2 vUv;
float distSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-3), 0.0, 1.0); return length(pa - ba * h); }
void main() {
  vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec2 off = vec2(0.0);
  // ondas de choque: anel de refração (empurra a imagem para fora na frente da onda)
  for (int i = 0; i < 4; i++) {
    vec4 o = uOndas[i];
    if (o.w <= 0.0) continue;
    vec2 d = px - o.xy; float r = length(d);
    float k = exp(-pow((r - o.z) / 26.0, 2.0)) * o.w;
    off += d / max(r, 1.0) * k * 18.0 * sign(r - o.z + 6.0);
  }
  // lente do portal: puxa a imagem para o centro (como gravidade)
  if (uLente.w > 0.0) {
    vec2 d = px - uLente.xy; float r = length(d);
    float k = smoothstep(uLente.z * 1.8, 0.0, r);
    off -= d * k * k * 0.35 * uLente.w;
  }
  // calor: o ar ondula ao longo do feixe (segmento A→B, largura em uCalorB.z)
  if (uCalorB.w > 0.0) {
    float d = distSeg(px, uCalorA.xy, uCalorA.zw);
    float k = smoothstep(uCalorB.z, 0.0, d) * uCalorB.w;
    off += vec2(ruido(px * 0.045 + vec2(0.0, uTempo * 3.0)) - 0.5, ruido(px * 0.05 - vec2(uTempo * 2.5, 0.0)) - 0.5) * 14.0 * k;
  }
  vec2 uv = (px - off) / uRes; uv.y = 1.0 - uv.y;
  vec4 c = texture2D(uCena, uv);
  vec3 b = texture2D(uBloom, uv).rgb;
  gl_FragColor = vec4(c.rgb + b * uBloomK, c.a);
}`

export class Render {
  gl: GL
  W = 0
  H = 0
  dpr = 1
  escalaCena = 0.75
  cena!: Alvo
  bloomA!: Alvo
  bloomB!: Alvo
  pLinha: Prog
  pPart: Prog
  pClaro: Prog
  pBlur: Prog
  pComp: Prog
  bufLinha: WebGLBuffer
  bufPart: WebGLBuffer
  maxPonto = 64

  constructor(gl: GL) {
    this.gl = gl
    this.pLinha = programa(gl, VS_LINHA, FS_LINHA, ['uRes', 'uShake'], ['aPos', 'aLado', 'aCor', 'aNuc'])
    this.pPart = programa(gl, VS_PART, FS_PART, ['uRes', 'uShake', 'uEscala'], ['aPos', 'aTam', 'aCor', 'aInfo'])
    this.pClaro = programa(gl, VS_TELA, FS_CLARO, ['uTex'])
    this.pBlur = programa(gl, VS_TELA, FS_BLUR, ['uTex', 'uDir'])
    this.pComp = programa(gl, VS_TELA, FS_COMPOSICAO, ['uCena', 'uBloom', 'uRes', 'uTempo', 'uBloomK', 'uOndas', 'uLente', 'uCalorA', 'uCalorB'])
    this.bufLinha = gl.createBuffer()!
    this.bufPart = gl.createBuffer()!
    const faixa = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array
    this.maxPonto = faixa ? faixa[1] : 64
  }

  redimensionar(W: number, H: number, dpr: number) {
    const gl = this.gl
    this.W = W
    this.H = H
    this.dpr = dpr
    if (this.cena) [this.cena, this.bloomA, this.bloomB].forEach((a) => apagarAlvo(gl, a))
    const cw = Math.max(2, Math.round(W * dpr * this.escalaCena))
    const ch = Math.max(2, Math.round(H * dpr * this.escalaCena))
    this.cena = alvo(gl, cw, ch)
    this.bloomA = alvo(gl, Math.max(2, cw >> 2), Math.max(2, ch >> 2))
    this.bloomB = alvo(gl, Math.max(2, cw >> 2), Math.max(2, ch >> 2))
  }

  /** Começa a cena (alvo transparente). */
  iniciarCena() {
    const gl = this.gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.cena.fb)
    gl.viewport(0, 0, this.cena.w, this.cena.h)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.enable(gl.BLEND)
  }

  /** Mistura "por cima" (alfa pré-multiplicado). */
  sobre() {
    this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA)
  }
  /** Mistura aditiva (luz). */
  luz() {
    this.gl.blendFunc(this.gl.ONE, this.gl.ONE)
  }

  linhas(ls: Linha[], shake: [number, number]) {
    if (!ls.length) return
    const gl = this.gl
    // 11 floats por vértice: pos(2) lado(1) cor(4) núcleo(4); 6 vértices por segmento
    let n = 0
    for (const l of ls) n += Math.max(0, l.pts.length - 1) * 6
    const v = new Float32Array(n * 11)
    let o = 0
    const put = (x: number, y: number, lado: number, l: Linha, frac: number) => {
      v[o++] = x
      v[o++] = y
      v[o++] = lado
      v[o++] = l.halo[0]
      v[o++] = l.halo[1]
      v[o++] = l.halo[2]
      v[o++] = l.alfa
      v[o++] = l.nucleo[0]
      v[o++] = l.nucleo[1]
      v[o++] = l.nucleo[2]
      v[o++] = l.escura ? -1 : frac
    }
    for (const l of ls) {
      const frac = l.nucLarg / l.larg
      for (let i = 1; i < l.pts.length; i++) {
        const a = l.pts[i - 1]
        const b = l.pts[i]
        let nx = -(b.y - a.y)
        let ny = b.x - a.x
        const len = Math.hypot(nx, ny) || 1
        nx = (nx / len) * l.larg
        ny = (ny / len) * l.larg
        // estende um pouco cada segmento para emendar as juntas
        const ex = ((b.x - a.x) / len) * l.larg * 0.35
        const ey = ((b.y - a.y) / len) * l.larg * 0.35
        const ax = a.x - ex
        const ay = a.y - ey
        const bx = b.x + ex
        const by = b.y + ey
        put(ax + nx, ay + ny, 1, l, frac)
        put(ax - nx, ay - ny, -1, l, frac)
        put(bx + nx, by + ny, 1, l, frac)
        put(bx + nx, by + ny, 1, l, frac)
        put(ax - nx, ay - ny, -1, l, frac)
        put(bx - nx, by - ny, -1, l, frac)
      }
    }
    const p = this.pLinha
    gl.useProgram(p.p)
    gl.uniform2f(p.u.uRes, this.W, this.H)
    gl.uniform2f(p.u.uShake, shake[0], shake[1])
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufLinha)
    gl.bufferData(gl.ARRAY_BUFFER, v, gl.DYNAMIC_DRAW)
    const S = 11 * 4
    gl.enableVertexAttribArray(p.a.aPos)
    gl.vertexAttribPointer(p.a.aPos, 2, gl.FLOAT, false, S, 0)
    gl.enableVertexAttribArray(p.a.aLado)
    gl.vertexAttribPointer(p.a.aLado, 1, gl.FLOAT, false, S, 8)
    gl.enableVertexAttribArray(p.a.aCor)
    gl.vertexAttribPointer(p.a.aCor, 4, gl.FLOAT, false, S, 12)
    gl.enableVertexAttribArray(p.a.aNuc)
    gl.vertexAttribPointer(p.a.aNuc, 4, gl.FLOAT, false, S, 28)
    gl.drawArrays(gl.TRIANGLES, 0, n)
    gl.disableVertexAttribArray(p.a.aLado)
    gl.disableVertexAttribArray(p.a.aCor)
    gl.disableVertexAttribArray(p.a.aNuc)
  }

  particulas(ps: Particula[], shake: [number, number]) {
    if (!ps.length) return
    const gl = this.gl
    const v = new Float32Array(ps.length * 9)
    let o = 0
    const escala = this.dpr * this.escalaCena
    const max = this.maxPonto / escala
    for (const p of ps) {
      const k = Math.min(1, p.vida / p.max)
      v[o++] = p.x
      v[o++] = p.y
      v[o++] = Math.min(max, p.tam0 + (p.tam1 - p.tam0) * k)
      v[o++] = p.cor[0]
      v[o++] = p.cor[1]
      v[o++] = p.cor[2]
      v[o++] = Math.max(0, p.a0 + (p.a1 - p.a0) * k)
      v[o++] = p.tipo
      v[o++] = p.seed
    }
    const pr = this.pPart
    gl.useProgram(pr.p)
    gl.uniform2f(pr.u.uRes, this.W, this.H)
    gl.uniform2f(pr.u.uShake, shake[0], shake[1])
    gl.uniform1f(pr.u.uEscala, escala)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPart)
    gl.bufferData(gl.ARRAY_BUFFER, v, gl.DYNAMIC_DRAW)
    const S = 9 * 4
    gl.enableVertexAttribArray(pr.a.aPos)
    gl.vertexAttribPointer(pr.a.aPos, 2, gl.FLOAT, false, S, 0)
    gl.enableVertexAttribArray(pr.a.aTam)
    gl.vertexAttribPointer(pr.a.aTam, 1, gl.FLOAT, false, S, 8)
    gl.enableVertexAttribArray(pr.a.aCor)
    gl.vertexAttribPointer(pr.a.aCor, 4, gl.FLOAT, false, S, 12)
    gl.enableVertexAttribArray(pr.a.aInfo)
    gl.vertexAttribPointer(pr.a.aInfo, 2, gl.FLOAT, false, S, 28)
    gl.drawArrays(gl.POINTS, 0, ps.length)
    gl.disableVertexAttribArray(pr.a.aTam)
    gl.disableVertexAttribArray(pr.a.aCor)
    gl.disableVertexAttribArray(pr.a.aInfo)
  }

  /** Bloom: partes claras da cena → 1/4 da resolução → desfoque em duas direções (duas vezes). */
  bloom() {
    const gl = this.gl
    gl.disable(gl.BLEND)
    const passo = (src: WebGLTexture, dst: Alvo, prog: Prog, dir?: [number, number]) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb)
      gl.viewport(0, 0, dst.w, dst.h)
      gl.useProgram(prog.p)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, src)
      gl.uniform1i(prog.u.uTex, 0)
      if (dir) gl.uniform2f(prog.u.uDir, dir[0] / dst.w, dir[1] / dst.h)
      telaCheia(gl, prog)
    }
    passo(this.cena.tex, this.bloomA, this.pClaro)
    passo(this.bloomA.tex, this.bloomB, this.pBlur, [1, 0])
    passo(this.bloomB.tex, this.bloomA, this.pBlur, [0, 1])
    passo(this.bloomA.tex, this.bloomB, this.pBlur, [2, 0])
    passo(this.bloomB.tex, this.bloomA, this.pBlur, [0, 2])
  }

  /** Composição na tela: cena distorcida + bloom. */
  compor(t: number, ondas: number[], lente: number[], calorA: number[], calorB: number[], bloomK: number) {
    const gl = this.gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
    gl.disable(gl.BLEND)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    const p = this.pComp
    gl.useProgram(p.p)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.cena.tex)
    gl.uniform1i(p.u.uCena, 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.bloomA.tex)
    gl.uniform1i(p.u.uBloom, 1)
    gl.uniform2f(p.u.uRes, this.W, this.H)
    gl.uniform1f(p.u.uTempo, t)
    gl.uniform1f(p.u.uBloomK, bloomK)
    gl.uniform4fv(p.u.uOndas, new Float32Array(ondas))
    gl.uniform4fv(p.u.uLente, new Float32Array(lente))
    gl.uniform4fv(p.u.uCalorA, new Float32Array(calorA))
    gl.uniform4fv(p.u.uCalorB, new Float32Array(calorB))
    telaCheia(gl, p)
    gl.activeTexture(gl.TEXTURE0)
  }
}
