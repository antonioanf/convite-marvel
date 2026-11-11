/**
 * Uma rodada do Lighthouse (celular, configuração padrão) no Chromium do Playwright.
 * Uso: node scripts/lighthouse.mjs <rótulo> [url] [caminho-do-cli-do-lighthouse]
 *   (o Lighthouse não é dependência do projeto: instale em outra pasta, ex.: npm i lighthouse@13)
 * Salva screenshots/lighthouse/<rótulo>.json e mostra as notas e as métricas.
 */
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'

const [rotulo = 'agora', url = 'http://localhost:4173/', cli = process.env.LIGHTHOUSE_CLI] = process.argv.slice(2)
if (!cli) throw new Error('passe o caminho do cli do Lighthouse (…/lighthouse/cli/index.js) ou LIGHTHOUSE_CLI')
mkdirSync('screenshots/lighthouse', { recursive: true })
const saida = `screenshots/lighthouse/${rotulo}.json`
try {
  execFileSync(process.execPath, [cli, url, '--quiet', '--chrome-flags=--headless=new', '--output=json', `--output-path=${saida}`], {
    env: { ...process.env, CHROME_PATH: chromium.executablePath() },
    stdio: ['ignore', 'ignore', 'inherit'],
  })
} catch (e) {
  console.log('(o Lighthouse terminou com aviso; lendo o relatório mesmo assim)', e.status)
}
const r = JSON.parse(readFileSync(saida, 'utf8'))
console.log(`Lighthouse ${r.lighthouseVersion} · ${rotulo}`)
console.log(Object.values(r.categories).map((c) => `${c.title}: ${Math.round(c.score * 100)}`).join(' · '))
for (const k of ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'])
  console.log(`  ${r.audits[k].title}: ${r.audits[k].displayValue}`)
const lcp = r.audits['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.snippet
if (lcp) console.log('  Elemento do LCP:', lcp.slice(0, 120))
