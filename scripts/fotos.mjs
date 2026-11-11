/**
 * Converte as fotos de originais/ para WebP em public/fotos/.
 * Uso: npm run fotos
 *  - <nome>.webp      até 1200 px de largura (nunca amplia), qualidade 84 (as fotos de origem são pequenas, então priorizamos nitidez)
 *  - <nome>-600.webp  600 px, para o carrossel
 */
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const src = path.join(root, 'originais')
const out = path.join(root, 'public/fotos')
fs.mkdirSync(out, { recursive: true })

// borboleta.png é a borboleta da intro (npm run borboleta), não uma foto
for (const f of fs.readdirSync(src).filter((f) => /\.(png|jpe?g|webp|heic)$/i.test(f) && !/^borboleta\./i.test(f))) {
  const name = f.replace(/\.[^.]+$/, '')
  const big = path.join(out, `${name}.webp`)
  const small = path.join(out, `${name}-600.webp`)
  await sharp(path.join(src, f)).rotate().resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 84, effort: 6 }).toFile(big)
  await sharp(path.join(src, f)).rotate().resize({ width: 600, withoutEnlargement: true }).webp({ quality: 72, effort: 6 }).toFile(small)
  const m = await sharp(big).metadata()
  const kb = (p) => Math.round(fs.statSync(p).size / 1024)
  console.log(`${name}: ${m.width}x${m.height} · ${kb(big)} KB · 600px ${kb(small)} KB`)
}
