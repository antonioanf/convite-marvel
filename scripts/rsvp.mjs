/** Testa "Aceitar missão": nome → portal → credencial → salvar PNG. node scripts/rsvp.mjs [url] */
import { chromium, devices } from 'playwright'
import { mkdirSync } from 'node:fs'
const url = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:5173/'
mkdirSync('screenshots/rsvp', { recursive: true })
const { defaultBrowserType, ...pixel } = devices['Pixel 5'] // eslint-disable-line no-unused-vars
const b = await chromium.launch({ args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const ctx = await b.newContext({ ...pixel, locale: 'pt-BR', acceptDownloads: true })
const p = await ctx.newPage()
const erros = []
p.on('pageerror', (e) => erros.push(String(e)))
await p.goto(url + '?abrir=1&modo=normal', { waitUntil: 'load' })
await p.waitForTimeout(2000)
await p.evaluate(() => document.getElementById('confirmar').scrollIntoView({ block: 'start' }))
await p.waitForTimeout(1200)
await p.locator('#confirmar button[type=submit]').click()
await p.waitForTimeout(400)
console.log('erro com nome vazio:', await p.locator('#confirmar [role=alert]').textContent())
await p.locator('#confirmar input[name=nome]').fill('Ana e família')
await p.locator('#confirmar button[type=submit]').click()
await p.waitForTimeout(700)
await p.screenshot({ path: 'screenshots/rsvp/1-portal.png' })
await p.waitForTimeout(1800)
await p.screenshot({ path: 'screenshots/rsvp/2-credencial.png' })
console.log('aviso sem WhatsApp:', (await p.locator('#confirmar [role=note]').count()) > 0)
const dl = p.waitForEvent('download', { timeout: 8000 }).catch(() => null)
await p.getByRole('button', { name: /Salvar credencial/ }).click()
const d = await dl
if (d) await d.saveAs('screenshots/rsvp/credencial.png')
console.log('download:', d ? d.suggestedFilename() : 'não houve')
await p.waitForTimeout(800)
await p.screenshot({ path: 'screenshots/rsvp/3-salvo.png' })
console.log('erros:', erros.length ? erros : 'nenhum')
await b.close()
