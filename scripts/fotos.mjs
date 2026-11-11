/**
 * Converte a imagem de fundo das seções (originais/fundo.jpg ou .png) para WebP em public/fotos/:
 *   fundo-1200.webp  (1200 px de largura, telas grandes / 3x)
 *   fundo-750.webp   (750 px, celulares menores)
 * Qualidade ~72; se passar de ~200 KB, baixa a qualidade até caber.
 * Uso: npm run fotos
 */
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const src = path.join(root, 'originais')
const out = path.join(root, 'public/fotos')
const LIMITE = 200 * 1024
const orig = ['fundo.jpg', 'fundo.jpeg', 'fundo.png', 'fundo.webp'].map((f) => path.join(src, f)).find((f) => fs.existsSync(f))
if (!orig) {
  console.log('Sem originais/fundo.jpg (ou .png): nada para converter.')
  process.exit(0)
}
fs.mkdirSync(out, { recursive: true })
const meta = await sharp(orig).metadata()
for (const w of [1200, 750]) {
  const dest = path.join(out, `fundo-${w}.webp`)
  let q = 72
  let buf
  do {
    // se o original for menor que a largura pedida, amplia (fica atrás de uma camada escura)
    buf = await sharp(orig).rotate().resize({ width: w, kernel: 'lanczos3' }).webp({ quality: q, effort: 6 }).toBuffer()
    q -= 4
  } while (buf.length > LIMITE && q > 40)
  fs.writeFileSync(dest, buf)
  const m = await sharp(buf).metadata()
  console.log(`fundo-${w}.webp: ${m.width}x${m.height} · ${Math.round(buf.length / 1024)} KB · qualidade ${q + 4}${meta.width < w ? ` (ampliada de ${meta.width} px)` : ''}`)
}
