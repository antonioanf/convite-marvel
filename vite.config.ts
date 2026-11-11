import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { convite } from './src/config/convite.ts'
import { buildIcs } from './src/lib/calendar.ts'
import { temaCss } from './src/config/tema.ts'
import { emblemaSvg, ESCUDO } from './src/lib/emblema.ts'
import { cidadeSvg } from './src/lib/cidade.ts'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const fmt = (o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: convite.festa.fusoHorario, ...o }).format(new Date(convite.festa.dataHora))

/** "26 DE NOVEMBRO · 15H" (sem o horário se ainda não estiver definido) */
function dataLonga() {
  const dia = fmt({ day: 'numeric', month: 'long' }).toLocaleUpperCase('pt-BR')
  if (!convite.festa.horarioDefinido) return dia
  const h = fmt({ hour: '2-digit', minute: '2-digit' }).replace(':00', 'H').replace(':', 'H')
  return `${dia} · ${h}`
}

/**
 * Lê src/config/convite.ts e:
 *  - preenche título, descrição, Open Graph e theme-color no index.html;
 *  - injeta a paleta como variáveis CSS (sem "piscar" a cor padrão);
 *  - embute o emblema de metal e a cidade na abertura (aparecem junto com o HTML);
 *  - gera /convite.ics (agenda) e /favicon.svg (o emblema) no dev e no build.
 */
function convitePlugin(): Plugin {
  const p = convite.paleta
  const favicon = emblemaSvg(p)
  // TODO no config: sem site.url a imagem fica relativa e o WhatsApp não mostra a prévia
  const ogImage = /^https?:/.test(convite.site.imagemOg)
    ? convite.site.imagemOg
    : (convite.site.url || '') + convite.site.imagemOg
  const vars: Record<string, string> = {
    '%TITULO%': esc(convite.site.titulo),
    '%DESCRICAO%': esc(convite.site.descricao),
    '%URL%': esc(convite.site.url),
    '%OG_IMAGE%': esc(ogImage),
    '%THEME%': p.fundo,
    '%NOME%': esc(convite.crianca.nome),
    '%DATA_LONGA%': esc(dataLonga()),
    '%PALETA%': temaCss(p),
    '%EMBLEMA%': emblemaSvg(p, { id: 'in' }),
    '%ESCUDO_PATH%': ESCUDO,
    '%EMBLEMA_BRASA%': emblemaSvg(p, { id: 'ib', variante: 'brasa', attrs: 'class="in-brasa"' }),
    '%CIDADE%': cidadeSvg({ fundo: '#0B111C', frente: '#06090F', contorno: '#0F1726', janela: 'rgba(255,196,120,.42)' }, { seed: 4, contorno: false, janela: [1.6, 1.8], chance: 0.16, altura: 1.25 }),
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

/**
 * Chunks dos efeitos com nome conhecido (versão do build no lugar do hash), para o app poder pedir
 * de novo por outro endereço se o download falhar (lib/chunks.ts). Os demais seguem com hash.
 */
const versao = Date.now().toString(36)
const CHUNKS: Record<string, string> = {
  'src/poderes/motor.ts': `assets/motor-${versao}.js`,
  'src/poderes/gl/renderGL.ts': `assets/efeitos-gl-${versao}.js`,
}
const nomeChunk = (c: { facadeModuleId?: string | null }) => {
  const id = c.facadeModuleId?.split('\\').join('/') ?? ''
  return Object.entries(CHUNKS).find(([k]) => id.endsWith(k))?.[1] ?? 'assets/[name]-[hash].js'
}

export default defineConfig({
  plugins: [react(), tailwindcss(), convitePlugin(), prefetchApp()],
  define: {
    __CHUNKS__: JSON.stringify({ motor: CHUNKS['src/poderes/motor.ts'], 'efeitos-gl': CHUNKS['src/poderes/gl/renderGL.ts'] }),
  },
  build: {
    target: 'es2020',
    cssMinify: true,
    rolldownOptions: { output: { chunkFileNames: nomeChunk } },
  },
  server: { host: false },
})
