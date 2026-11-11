import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { convite } from './src/config/convite.ts'
import { buildIcs } from './src/lib/calendar.ts'
import { temaCss } from './src/config/tema.ts'
import { emblemaSvg } from './src/lib/emblema.ts'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** "26 · 11 · 2026" no fuso da festa */
function dataCurta() {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: convite.festa.fusoHorario, day: '2-digit', month: '2-digit', year: 'numeric' })
    .format(new Date(convite.festa.dataHora))
    .split('/')
    .join(' · ')
}

/**
 * Lê src/config/convite.ts e:
 *  - preenche título, descrição, Open Graph e theme-color no index.html;
 *  - injeta a paleta como variáveis CSS (sem "piscar" a cor padrão);
 *  - embute o emblema na intro (aparece junto com o HTML);
 *  - gera /convite.ics (agenda) e /favicon.svg (o emblema) no dev e no build.
 */
function convitePlugin(): Plugin {
  const p = convite.paleta
  const hero = convite.heroi.foto
  const favicon = emblemaSvg(p)
  // TODO no config: sem site.url a imagem fica relativa e o WhatsApp não mostra a prévia
  const ogImage = /^https?:/.test(convite.site.imagemOg)
    ? convite.site.imagemOg
    : (convite.site.url || '') + convite.site.imagemOg
  const heroSrcset = hero?.src && hero.srcPequena ? `${hero.srcPequena} 600w, ${hero.src} ${hero.largura ?? 1200}w` : hero?.src ?? ''
  const vars: Record<string, string> = {
    '%TITULO%': esc(convite.site.titulo),
    '%DESCRICAO%': esc(convite.site.descricao),
    '%URL%': esc(convite.site.url),
    '%OG_IMAGE%': esc(ogImage),
    '%THEME%': p.ceu,
    '%NOME%': esc(convite.crianca.nome),
    '%HEROI%': esc(convite.heroi.nome),
    '%IDADE%': String(convite.crianca.idade),
    '%DATA_CURTA%': dataCurta(),
    '%PALETA%': temaCss(p),
    // foto do hero (se houver): começa a baixar junto com o HTML
    '%HERO_PRELOAD%': hero?.src
      ? `<link rel="preload" as="image" href="${esc(hero.src)}" imagesrcset="${esc(heroSrcset)}" imagesizes="(max-width: 480px) 92vw, 450px" fetchpriority="high" />`
      : '',
    '%EMBLEMA%': emblemaSvg(p, { glow: true, attrs: 'class="cv-emb-svg"' }),
  }
  return {
    name: 'convite-config',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => Object.entries(vars).reduce((acc, [k, v]) => acc.split(k).join(v), html),
    },
    configureServer(server) {
      server.middlewares.use('/favicon.svg', (_req, res) => {
        res.setHeader('Content-Type', 'image/svg+xml')
        res.end(favicon)
      })
      server.middlewares.use('/convite.ics', (_req, res) => {
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
        res.end(buildIcs(convite))
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'favicon.svg', source: favicon })
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
  },
  server: { host: false },
})
