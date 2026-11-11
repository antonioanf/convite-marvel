/** Junta os quadros de cada poder numa folha (grade) para revisar: node scripts/folha.mjs [pasta] */
import sharp from 'sharp'
import { readdirSync } from 'node:fs'

const pasta = process.argv[2] ?? 'screenshots/quadros'
const arqs = readdirSync(pasta).filter((f) => /-\d\d\.png$/.test(f))
const grupos = {}
for (const f of arqs) (grupos[f.replace(/-\d\d\.png$/, '')] ??= []).push(f)
for (const [nome, fs] of Object.entries(grupos)) {
  fs.sort()
  const w = 216
  const h = 400
  const cols = 7
  const linhas = Math.ceil(fs.length / cols)
  const tiles = await Promise.all(fs.map((f) => sharp(`${pasta}/${f}`).resize(w, h).toBuffer()))
  await sharp({ create: { width: cols * w, height: linhas * h, channels: 3, background: '#000' } })
    .composite(tiles.map((input, i) => ({ input, left: (i % cols) * w, top: Math.floor(i / cols) * h })))
    .png()
    .toFile(`${pasta}/_folha-${nome}.png`)
}
console.log('folhas:', Object.keys(grupos).join(', '))
