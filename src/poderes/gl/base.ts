/**
 * Base do WebGL (1.0, para funcionar no maior número de celulares): programas, alvos de render
 * (framebuffers) e o quadrado de tela cheia. Sem bibliotecas.
 */
export type GL = WebGLRenderingContext

export const VS_TELA = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`

/** Ruído e fbm compartilhados pelos shaders. */
export const GLSL_RUIDO = `
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float ruido(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * ruido(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}`

/** highp no fragmento só onde existe (todo iPhone com WebGL tem; alguns Android antigos não). */
const PRECISAO = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`

export interface Prog {
  p: WebGLProgram
  u: Record<string, WebGLUniformLocation | null>
  a: Record<string, number>
}

function compilar(gl: GL, tipo: number, src: string) {
  const s = gl.createShader(tipo)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s)
    gl.deleteShader(s)
    throw new Error('shader: ' + log)
  }
  return s
}

export function programa(gl: GL, vs: string, fs: string, uniforms: string[], attribs: string[] = ['aPos']): Prog {
  const p = gl.createProgram()!
  gl.attachShader(p, compilar(gl, gl.VERTEX_SHADER, vs))
  gl.attachShader(p, compilar(gl, gl.FRAGMENT_SHADER, PRECISAO + fs))
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p))
  const u: Prog['u'] = {}
  for (const n of uniforms) u[n] = gl.getUniformLocation(p, n)
  const a: Prog['a'] = {}
  for (const n of attribs) a[n] = gl.getAttribLocation(p, n)
  return { p, u, a }
}

export interface Alvo {
  fb: WebGLFramebuffer
  tex: WebGLTexture
  w: number
  h: number
}

export function alvo(gl: GL, w: number, h: number): Alvo {
  const tex = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  const fb = gl.createFramebuffer()!
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  return { fb, tex, w, h }
}

export function apagarAlvo(gl: GL, a: Alvo) {
  gl.deleteFramebuffer(a.fb)
  gl.deleteTexture(a.tex)
}

let quad: WebGLBuffer | null = null
/** Desenha um quadrado de tela cheia com o programa ativo. */
export function telaCheia(gl: GL, prog: Prog) {
  if (!quad) {
    quad = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, quad)
  const a = prog.a.aPos
  gl.enableVertexAttribArray(a)
  gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
}

export function resetQuad() {
  quad = null
}
