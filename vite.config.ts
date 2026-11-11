import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { convite } from './src/config/convite.ts'
import { buildIcs } from './src/lib/calendar.ts'
import { temaCss } from './src/config/tema.ts'
import fs from 'node:fs'
import sharp from 'sharp'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Lê src/config/convite.ts e:
 *  - preenche título, descrição, Open Graph e theme-color no index.html;
 *  - injeta a paleta como variáveis CSS (sem "piscar" a cor padrão);
 *  - gera /convite.ics (arquivo de agenda) no dev e no build.
 */
/** "16 · 05 · 2027" no fuso da festa */
function dataCurta() {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: convite.festa.fusoHorario, day: '2-digit', month: '2-digit', year: 'numeric' })
    .format(new Date(convite.festa.dataHora))
    .split('/')
    .join(' · ')
}

/** Borboleta da intro (npm run borboleta): embutida como data URI + proporção, para a intro aparecer na hora. */
async function borboleta() {
  const file = new URL('./src/intro/borboleta.webp', import.meta.url)
  const buf = fs.readFileSync(file)
  const { width = 1, height = 1 } = await sharp(buf).metadata()
  return { uri: `data:image/webp;base64,${buf.toString('base64')}`, ratio: `${width} / ${height}` }
}

async function convitePlugin(): Promise<Plugin> {
  const p = convite.paleta
  const bf = await borboleta()
  const hero = convite.fotoPrincipal
  const palette = temaCss(p)
  // TODO no config: sem site.url a imagem fica relativa e o WhatsApp não mostra a prévia
  const ogImage = /^https?:/.test(convite.site.imagemOg)
    ? convite.site.imagemOg
    : (convite.site.url || '') + convite.site.imagemOg
  const vars: Record<string, string> = {
    '%TITULO%': esc(convite.site.titulo),
    '%DESCRICAO%': esc(convite.site.descricao),
    '%URL%': esc(convite.site.url),
    '%OG_IMAGE%': esc(ogImage),
    '%THEME%': p.perola,
    '%NOME%': esc(convite.crianca.nome),
    '%IDADE%': String(convite.crianca.idade),
    '%DATA_CURTA%': dataCurta(),
    '%PALETA%': palette,
    '%HERO_SRC%': esc(hero.src ?? ''),
    '%HERO_SRCSET%': esc(hero.srcPequena && hero.src ? `${hero.srcPequena} 600w, ${hero.src} ${hero.largura ?? 1200}w` : hero.src ?? ''),
    '%BORBOLETA_RATIO%': bf.ratio,
    '%BORBOLETA%': bf.uri,
  }
  return {
    name: 'convite-config',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => Object.entries(vars).reduce((acc, [k, v]) => acc.split(k).join(v), html),
    },
    configureServer(server) {
      server.middlewares.use('/convite.ics', (_req, res) => {
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
        res.end(buildIcs(convite))
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'convite.ics', source: buildIcs(convite) })
    },
  }
}

/** Pré-baixa (sem executar) o chunk do app: o toque de abertura fica instantâneo sem pesar no carregamento. */
function prefetchApp(): Plugin {
  return {
    name: 'prefetch-app',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const bundle = ctx.bundle ?? {}
        const chunk = Object.values(bundle).find(
          (c) => c.type === 'chunk' && c.facadeModuleId?.replace(/\\/g, '/').endsWith('src/app/mount.tsx'),
        )
        if (!chunk || chunk.type !== 'chunk') return
        const files = [chunk.fileName, ...chunk.imports].filter((f) => { const c = bundle[f]; return !(c?.type === 'chunk' && c.isEntry) })
        return files.map((f) => ({ tag: 'link', attrs: { rel: 'prefetch', href: '/' + f, as: 'script' }, injectTo: 'head' as const }))
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), convitePlugin(), prefetchApp()],
  build: {
    target: 'es2020',
    cssMinify: true,
    // A cena 3D (three.js) é um chunk separado, carregado só depois da intro.
    chunkSizeWarningLimit: 1200,
  },
  server: { host: false },
})
