/**
 * Shaders de tela cheia de cada poder (desenhados na cena, antes do bloom e da distorção).
 * Saída em alfa pré-multiplicado: luz = rgb com alfa 0 (soma), escuridão/fumaça = alfa > 0.
 */
import { GLSL_RUIDO } from './base'

const PX = `vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uRes;`

/** Tempestade: nuvens pesadas iluminadas por dentro, escurecimento, chuva na diagonal e marca de energia no chão. */
export const FS_TEMPESTADE = `
${GLSL_RUIDO}
uniform vec2 uRes; uniform float uTempo; uniform float uAlfa; uniform float uLuz; uniform vec2 uLuzPos; uniform vec4 uMarca;
varying vec2 vUv;
void main() {
  ${PX}
  float y = px.y / uRes.y;
  vec2 q = px * 0.0032 + vec2(uTempo * 0.05, uTempo * 0.012);
  float d = fbm(q + vec2(fbm(q * 1.7 + uTempo * 0.04), fbm(q * 1.3 - uTempo * 0.03)) * 0.9);
  float faixa = smoothstep(0.66, 0.02, y);
  float dens = smoothstep(0.32, 0.82, d) * faixa;
  // base das nuvens: azul-chumbo, mais clara nas bordas de cima (luz de fora)
  vec3 base = mix(vec3(0.03, 0.045, 0.08), vec3(0.15, 0.19, 0.28), d * d);
  // iluminação interna: o relâmpago acende a nuvem por dentro, mais forte perto da origem do raio
  float dl = length((px - uLuzPos) / uRes.y);
  vec3 luz = vec3(0.62, 0.76, 1.0) * uLuz * (exp(-dl * 3.2) * 1.4 + 0.18) * (0.35 + d);
  vec3 nuv = base + luz;
  vec4 c = vec4(nuv * dens, dens * 0.94);
  // escurece a tela toda (céu fechando)
  float escuro = 0.34 + 0.12 * faixa;
  c = c + vec4(0.0, 0.0, 0.0, escuro) * (1.0 - c.a);
  // chuva: riscos finos na diagonal, em duas profundidades
  vec3 chuva = vec3(0.0);
  for (int k = 0; k < 2; k++) {
    float fk = float(k);
    float esp = 9.0 - fk * 4.0;
    vec2 r = px; r.x += r.y * 0.24;
    float col = floor(r.x / esp);
    float h = hash(vec2(col, 3.1 + fk * 7.0));
    float vel = (1300.0 - fk * 500.0) + h * 400.0;
    float comp = 160.0 + h * 220.0;
    float yy = fract((px.y - uTempo * vel) / comp + h);
    float gota = smoothstep(0.0, 0.04, yy) * smoothstep(0.22 - fk * 0.08, 0.0, yy);
    float fino = smoothstep(0.5, 0.0, abs(fract(r.x / esp) - 0.5) * esp * (0.9 + fk * 0.6));
    chuva += vec3(0.62, 0.7, 0.85) * gota * fino * step(0.45, h) * (0.32 - fk * 0.14);
  }
  chuva *= 1.0 + uLuz * 2.5;
  // marca de energia onde o raio caiu: brilho achatado (chão) com crepitar elétrico
  vec3 marca = vec3(0.0);
  if (uMarca.w > 0.0) {
    vec2 dm = (px - uMarca.xy) * vec2(1.0, 2.8);
    float rm = length(dm);
    float vida = exp(-uMarca.z * 1.3) * uMarca.w;
    float crep = pow(ruido(px * 0.09 + vec2(uTempo * 17.0, 0.0)), 5.0) * 3.0;
    marca = vec3(0.55, 0.75, 1.0) * (exp(-rm / 26.0) * 1.6 + exp(-rm / 70.0) * 0.4 + crep * exp(-rm / 55.0)) * vida;
    marca += vec3(1.0, 0.55, 0.2) * exp(-rm / 14.0) * vida * 0.5;
  }
  gl_FragColor = (c + vec4(chuva + marca, 0.0)) * uAlfa;
}`

/** Ondas de choque (anéis de luz) + poço incandescente no ponto do impacto. */
export const FS_CHOQUE = `
${GLSL_RUIDO}
uniform vec2 uRes; uniform float uTempo; uniform vec4 uOnd[4]; uniform vec3 uOndCor[4]; uniform vec4 uPoco;
varying vec2 vUv;
void main() {
  ${PX}
  vec3 c = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    vec4 o = uOnd[i];
    if (o.w <= 0.0) continue;
    float r = length(px - o.xy);
    float esp = 5.0 + o.z * 0.035;
    float anel = exp(-pow((r - o.z) / esp, 2.0));
    float rastro = smoothstep(o.z, o.z * 0.55, r) * smoothstep(0.0, o.z * 0.55, r) * 0.08;
    float irregular = 0.75 + 0.5 * ruido(vec2(atan(px.y - o.y, px.x - o.x) * 6.0, uTempo * 3.0));
    c += uOndCor[i] * (anel * irregular + rastro) * o.w;
  }
  if (uPoco.w > 0.0) {
    float r = length((px - uPoco.xy) * vec2(1.0, 2.2));
    float k = exp(-pow(r / uPoco.z, 2.0) * 1.3) * uPoco.w;
    // temperatura de cor: amarelo-branco quente → laranja → vermelho escuro ao esfriar
    vec3 quente = mix(vec3(0.7, 0.08, 0.02), vec3(1.0, 0.5, 0.12), smoothstep(0.2, 0.6, uPoco.w));
    quente = mix(quente, vec3(1.0, 0.92, 0.7), smoothstep(0.7, 1.0, uPoco.w));
    c += quente * k * (0.8 + 0.4 * ruido(px * 0.06 + uTempo * 2.0));
  }
  gl_FragColor = vec4(c, 0.0);
}`

/** Rajada: feixe (núcleo branco, corpo laranja, franja azul) com turbulência, boca do disparo, impacto e a esfera de carga. */
export const FS_FEIXE = `
${GLSL_RUIDO}
uniform vec2 uRes; uniform float uTempo; uniform vec2 uA; uniform vec2 uB; uniform float uLarg; uniform float uForca; uniform float uAlcance; uniform float uCarga;
varying vec2 vUv;
void main() {
  ${PX}
  vec3 c = vec3(0.0);
  vec2 ab = uB - uA; float len = max(length(ab), 1.0); vec2 dir = ab / len;
  vec2 pa = px - uA;
  float ao = dot(pa, dir);
  float lado = abs(dot(pa, vec2(-dir.y, dir.x)));
  if (uForca > 0.0) {
    float fim = len * uAlcance;
    float dentro = smoothstep(-10.0, 6.0, ao) * smoothstep(fim + 6.0, fim - 26.0, ao);
    float turb = fbm(vec2(ao * 0.018 - uTempo * 7.0, lado * 0.06 + uTempo * 1.3));
    float w = uLarg * (0.75 + 0.55 * turb) * (0.85 + 0.15 * sin(uTempo * 60.0));
    float nucleo = exp(-pow(lado / (w * 0.14), 2.0));
    float corpo = exp(-pow(lado / (w * 0.5), 2.0));
    float halo = exp(-lado / (w * 1.5));
    c += (vec3(1.0, 0.98, 0.94) * nucleo * 1.5 + vec3(1.0, 0.5, 0.14) * corpo * 1.1 + vec3(0.3, 0.55, 1.0) * halo * 0.55) * dentro;
    // boca do disparo
    float ra = length(pa);
    c += (vec3(1.0, 0.85, 0.6) * exp(-ra / (uLarg * 0.9)) * 1.3 + vec3(0.35, 0.6, 1.0) * exp(-ra / (uLarg * 3.0)) * 0.4);
    // ponto de impacto
    vec2 pf = uA + dir * fim;
    float rb = length(px - pf);
    c += vec3(1.0, 0.7, 0.35) * exp(-rb / (uLarg * 1.1)) * smoothstep(0.85, 1.0, uAlcance) * (0.9 + 0.3 * ruido(px * 0.1 + uTempo * 9.0));
    c *= uForca;
  }
  if (uCarga > 0.0) {
    // esfera de energia crescendo na ponta do dedo (pulsa e treme)
    float ra = length(pa);
    float R = 6.0 + uCarga * 26.0;
    float pulso = 0.85 + 0.15 * sin(uTempo * 30.0);
    float esf = exp(-pow(ra / (R * pulso), 2.0));
    float ang = atan(pa.y, pa.x);
    float raios = pow(ruido(vec2(ang * 5.0, uTempo * 8.0)), 3.0) * exp(-ra / (R * 2.2));
    c += vec3(1.0, 0.97, 0.9) * esf * 1.4 + vec3(1.0, 0.55, 0.18) * exp(-ra / (R * 1.4)) * 0.9 * uCarga + vec3(0.35, 0.6, 1.0) * raios * 0.9 * uCarga;
  }
  gl_FragColor = vec4(c, 0.0);
}`

/** Magia: névoa violeta e turquesa que segue o dedo, girando, com fiapos dourados. */
export const FS_NEVOA = `
${GLSL_RUIDO}
uniform vec2 uRes; uniform float uTempo; uniform vec3 uPts[24]; uniform float uN; uniform float uAlfa;
varying vec2 vUv;
mat2 rot(float a) { float s = sin(a), c = cos(a); return mat2(c, -s, s, c); }
void main() {
  ${PX}
  float dens = 0.0;
  for (int i = 0; i < 24; i++) {
    if (float(i) >= uN) break;
    vec3 p = uPts[i];
    float idade = p.z;
    float s = 46.0 + idade * 80.0;
    vec2 d = px - p.xy;
    dens += exp(-dot(d, d) / (s * s)) * (1.0 - idade) * 0.55;
  }
  dens = min(dens, 1.0);
  vec2 q = rot(uTempo * 0.35) * (px * 0.0075);
  float n = fbm(q * 1.4 + vec2(fbm(q * 2.2 + uTempo * 0.25), fbm(q * 1.8 - uTempo * 0.2)) * 1.3);
  // névoa translúcida: a cor fica em luz baixa (abaixo do limiar do bloom), só os fiapos brilham
  float massa = min(1.0, dens * (0.2 + n * 1.2));
  vec3 violeta = vec3(0.55, 0.32, 0.98);
  vec3 turquesa = vec3(0.08, 0.75, 0.8);
  vec3 cor = mix(violeta, turquesa, smoothstep(0.35, 0.7, fbm(q * 2.6 + 4.0)));
  // fiapos dourados: cristas finas do ruído, só onde há névoa
  float f = abs(ruido(rot(uTempo * 0.6) * (px * 0.016) + uTempo * 0.3) - 0.5);
  float fio = smoothstep(0.016, 0.0, f) * smoothstep(0.2, 0.7, dens) * (0.6 + 0.4 * ruido(px * 0.05 - uTempo));
  vec3 c = cor * massa * 0.4 + vec3(1.0, 0.78, 0.35) * fio * 0.95;
  gl_FragColor = vec4(c * uAlfa, massa * 0.22 * uAlfa);
}`

/** Portal: anéis de energia girando em sentidos opostos, símbolos inventados e um vazio estrelado no centro. */
export const FS_PORTAL = `
${GLSL_RUIDO}
uniform vec2 uRes; uniform float uTempo; uniform vec2 uC; uniform float uR; uniform float uAbre;
varying vec2 vUv;
const float PI = 3.14159265;
float seg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
// símbolo inventado: combinação de traços escolhida pelo "id" da célula
float simbolo(vec2 u, float id) {
  float h1 = hash(vec2(id, 1.0)), h2 = hash(vec2(id, 2.0)), h3 = hash(vec2(id, 3.0));
  float d = 1.0;
  d = min(d, seg(u, vec2(0.5, 0.15), vec2(0.5, 0.85)));
  if (h1 > 0.4) d = min(d, seg(u, vec2(0.2, 0.3 + h2 * 0.4), vec2(0.8, 0.7 - h2 * 0.4)));
  if (h2 > 0.5) d = min(d, abs(length(u - vec2(0.5, 0.5)) - 0.22));
  if (h3 > 0.55) d = min(d, seg(u, vec2(0.25, 0.85), vec2(0.75, 0.85)));
  if (h3 < 0.3) d = min(d, seg(u, vec2(0.2, 0.2), vec2(0.5, 0.5)));
  return d;
}
void main() {
  ${PX}
  vec2 d = px - uC;
  float R = uR * uAbre;
  float r = length(d) / max(R, 1.0);
  if (r > 1.9) { gl_FragColor = vec4(0.0); return; }
  float a = atan(d.y, d.x);
  vec3 c = vec3(0.0);
  float alfa = 0.0;
  // vazio estrelado no centro, com espiral (as estrelas giram mais rápido perto do meio)
  float vazio = smoothstep(0.66, 0.5, r);
  float sa = a + 2.4 / (r + 0.2) - uTempo * 1.8;
  vec2 cel = vec2(floor(sa * 9.0 / PI), floor(log(r + 0.02) * 16.0 + uTempo * 2.0));
  float est = pow(hash(cel), 30.0) * 3.0;
  vec3 fundoVazio = mix(vec3(0.02, 0.01, 0.06), vec3(0.08, 0.03, 0.16), fbm(vec2(sa * 2.0, r * 4.0)));
  c += (fundoVazio + vec3(0.8, 0.85, 1.0) * est * smoothstep(0.05, 0.3, r)) * vazio;
  alfa += vazio * 0.95;
  // borda do vazio: aro brilhante turquesa com energia irregular
  float energia = fbm(vec2(a * 3.0 + uTempo * 2.4, r * 5.0 - uTempo));
  c += vec3(0.15, 0.85, 0.9) * exp(-pow((r - 0.64) / 0.035, 2.0)) * (1.2 + energia);
  // anel turquesa (gira para um lado), anel violeta tracejado (gira para o outro), anel dourado fino
  float a1 = a + uTempo * 1.1;
  float a2 = a - uTempo * 0.8;
  c += vec3(0.1, 0.8, 0.85) * exp(-pow((r - 0.74) / 0.018, 2.0)) * (0.6 + 0.6 * step(0.35, fract(a1 * 6.0 / PI)));
  c += vec3(0.6, 0.35, 1.0) * exp(-pow((r - 0.86) / 0.022, 2.0)) * step(0.45, fract(a2 * 10.0 / PI + 0.3)) * 1.1;
  c += vec3(1.0, 0.75, 0.3) * exp(-pow((r - 1.04) / 0.012, 2.0)) * 1.0;
  // faixa de símbolos entre 0.89 e 1.0 (gira junto com o anel dourado)
  float a3 = a + uTempo * 0.45;
  float n = 26.0;
  float idc = floor((a3 + PI) / (2.0 * PI) * n);
  float ua = fract((a3 + PI) / (2.0 * PI) * n);
  float ur = (r - 0.895) / 0.12;
  if (ur > 0.0 && ur < 1.0) {
    float s = simbolo(vec2(ua, ur), idc);
    c += vec3(1.0, 0.8, 0.4) * smoothstep(0.09, 0.03, s) * 1.1;
  }
  // névoa de energia em volta
  c += mix(vec3(0.1, 0.6, 0.8), vec3(0.5, 0.3, 0.9), energia) * exp(-pow((r - 0.95) / 0.35, 2.0)) * 0.22 * energia;
  gl_FragColor = vec4(c, alfa);
}`
