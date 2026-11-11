/**
 * Prepara a borboleta da tela de abertura a partir de originais/borboleta.png.
 * Uso: npm run borboleta [-- largura qualidade]   (padrão: 400 px, qualidade 60)
 *
 *  1. Remove o fundo, se houver (preenche a partir das bordas a cor do fundo, com tolerância).
 *  2. Recorta no contorno da borboleta.
 *  3. Acha o eixo do corpo (o eixo de simetria vertical) e centraliza a imagem nele:
 *     assim a asa esquerda é exatamente a metade esquerda e a direita, a metade direita
 *     (o index.html separa as asas com clip-path em 50%).
 *  4. Grava src/intro/borboleta.webp (transparente). Se o original for menor que a largura pedida,
 *     amplia com lanczos e um leve realce de nitidez (a intro mostra a borboleta com 200 px; 400 px = tela 2x).
 *     O vite.config.ts embute esse arquivo no index.html (data URI) para a intro aparecer na hora.
 */
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const input = path.join(root, 'originais/borboleta.png')
const output = path.join(root, 'src/intro/borboleta.webp')
const [largura = 400, qualidade = 60] = process.argv.slice(2).map(Number)

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const W = info.width
const H = info.height
const at = (x, y) => (y * W + x) * 4

// 1) fundo: se os cantos são opacos, apaga (flood fill a partir das bordas) a cor parecida com a deles
const corners = [at(0, 0), at(W - 1, 0), at(0, H - 1), at(W - 1, H - 1)]
const opaqueCorners = corners.filter((i) => data[i + 3] > 200)
if (opaqueCorners.length >= 3) {
  const bg = [0, 1, 2].map((k) => opaqueCorners.reduce((s, i) => s + data[i + k], 0) / opaqueCorners.length)
  const dist = (i) => Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2])
  const seen = new Uint8Array(W * H)
  const stack = []
  for (let x = 0; x < W; x++) stack.push(x, 0, x, H - 1)
  for (let y = 0; y < H; y++) stack.push(0, y, W - 1, y)
  while (stack.length) {
    const y = stack.pop()
    const x = stack.pop()
    if (x < 0 || y < 0 || x >= W || y >= H || seen[y * W + x]) continue
    seen[y * W + x] = 1
    const i = at(x, y)
    const d = dist(i)
    if (d > 60) continue
    // borda suave: quanto mais perto da cor do fundo, mais transparente
    data[i + 3] = Math.round(data[i + 3] * Math.min(1, Math.max(0, (d - 18) / 42)))
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1)
  }
  console.log(`fundo removido (cor ${bg.map(Math.round).join(',')})`)
} else {
  console.log('fundo já transparente')
}

// 2) contorno
let x0 = W, y0 = H, x1 = -1, y1 = -1
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++)
    if (data[at(x, y) + 3] > 8) {
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y)
    }

// 3) eixo de simetria (testa eixos em meio pixel perto do centro do contorno)
const alpha = (x, y) => (x < 0 || x >= W ? 0 : data[at(x, y) + 3])
const mid = x0 + x1
let best = { c2: mid, err: Infinity }
for (let c2 = mid - Math.round((x1 - x0) * 0.15); c2 <= mid + Math.round((x1 - x0) * 0.15); c2++) {
  let diff = 0
  let tot = 0
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const v = alpha(x, y)
      diff += Math.abs(v - alpha(c2 - x, y))
      tot += v
    }
  if (diff / tot < best.err) best = { c2, err: diff / tot }
}
const axis = best.c2 / 2
const half = Math.ceil(Math.max(axis - x0, x1 - axis)) + 3
const left = Math.max(0, Math.floor(axis - half))
const width = Math.min(W - left, Math.round(half * 2))
const top = Math.max(0, y0 - 3)
const height = Math.min(H - top, y1 - y0 + 7)
console.log(`eixo do corpo em x=${axis} (assimetria ${(best.err * 100).toFixed(1)}%) · recorte ${width}x${height}`)

// 4) WebP transparente
fs.mkdirSync(path.dirname(output), { recursive: true })
await sharp(data, { raw: { width: W, height: H, channels: 4 } })
  .extract({ left, top, width, height })
  .resize({ width: largura, kernel: 'lanczos3' })
  .sharpen({ sigma: 0.6 })
  .webp({ quality: qualidade, alphaQuality: 40, smartSubsample: true, effort: 6 })
  .toFile(output)
const m = await sharp(output).metadata()
const kb = fs.statSync(output).size / 1024
console.log(`${path.relative(root, output)}: ${m.width}x${m.height} · ${kb.toFixed(1)} KB${kb > 60 ? '  ⚠ acima de 60 KB' : ''}`)
if (width < largura) console.log(`aviso: o recorte do original tem só ${width} px; foi ampliado para ${m.width} px. Para ficar nítida em telas 3x, use um original com 600 px ou mais.`)
