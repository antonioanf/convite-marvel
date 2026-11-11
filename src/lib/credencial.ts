/**
 * Credencial de agente em PNG (1080×680), desenhada em canvas: emblema JL, nome do convidado,
 * "MISSÃO · 26/11 · 15H", número da credencial e o selo APROVADO. Sem imagens externas.
 * `salvarCredencial` tenta compartilhar o arquivo (celular), senão baixa; a tela sempre mostra
 * a imagem como alternativa ("toque e segure para salvar").
 */
import { convite } from '../config/convite'
import { emblemaSvg } from './emblema'
import { diaBarraMes, horaCurta } from './datas'

export const missaoTxt = `MISSÃO · ${diaBarraMes}${horaCurta ? ` · ${horaCurta.toUpperCase()}` : ''}`

/** Número estável a partir do nome (o mesmo nome sempre gera o mesmo número). */
export function numeroCredencial(nome: string) {
  let h = 2166136261
  for (const ch of nome.toLocaleUpperCase('pt-BR')) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return `JL-${String((h >>> 0) % 100000).padStart(5, '0')}`
}

function imagem(src: string) {
  return new Promise<HTMLImageElement>((ok, erro) => {
    const i = new Image()
    i.onload = () => ok(i)
    i.onerror = erro
    i.src = src
  })
}

/** Texto com espaçamento entre letras (sem depender de ctx.letterSpacing). */
function espacado(ctx: CanvasRenderingContext2D, txt: string, x: number, y: number, esp: number) {
  let cx = x
  for (const ch of txt) {
    ctx.fillText(ch, cx, y)
    cx += ctx.measureText(ch).width + esp
  }
}

function retArred(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export async function desenharCredencial(nome: string): Promise<HTMLCanvasElement> {
  const W = 1080
  const H = 680
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  await Promise.all([
    document.fonts.load('110px "Bebas Neue"'),
    document.fonts.load('48px "Share Tech Mono"'),
    document.fonts.load('700 30px Inter'),
  ]).catch(() => {})

  // fundo: vidro escuro com luz roxa e turquesa
  retArred(ctx, 0, 0, W, H, 44)
  ctx.save()
  ctx.clip()
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#1A1544')
  bg.addColorStop(1, '#09091E')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  const g1 = ctx.createRadialGradient(120, 80, 0, 120, 80, 620)
  g1.addColorStop(0, 'rgba(123,47,247,.55)')
  g1.addColorStop(1, 'rgba(123,47,247,0)')
  ctx.fillStyle = g1
  ctx.fillRect(0, 0, W, H)
  const g2 = ctx.createRadialGradient(W - 80, H - 40, 0, W - 80, H - 40, 520)
  g2.addColorStop(0, 'rgba(20,200,196,.35)')
  g2.addColorStop(1, 'rgba(20,200,196,0)')
  ctx.fillStyle = g2
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = 'rgba(255,255,255,.035)'
  ctx.lineWidth = 2
  for (let x = -H; x < W; x += 26) {
    ctx.beginPath()
    ctx.moveTo(x, H)
    ctx.lineTo(x + H * 0.5, 0)
    ctx.stroke()
  }
  ctx.restore()
  // moldura dourada
  retArred(ctx, 12, 12, W - 24, H - 24, 36)
  ctx.strokeStyle = 'rgba(245,183,0,.8)'
  ctx.lineWidth = 4
  ctx.stroke()

  // emblema
  try {
    const svg = emblemaSvg(convite.paleta, { id: 'cr' })
    const img = await imagem(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`)
    ctx.save()
    ctx.shadowColor = 'rgba(255,106,0,.55)'
    ctx.shadowBlur = 40
    ctx.drawImage(img, 70, 170, 230, 258)
    ctx.restore()
  } catch {
    /* sem o emblema, a credencial continua válida */
  }

  const x0 = 350
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#B98DFF'
  ctx.font = '700 28px Inter, sans-serif'
  espacado(ctx, 'CREDENCIAL DE AGENTE', x0, 150, 9)

  // nome em metal (diminui até caber)
  const N = nome.toLocaleUpperCase('pt-BR')
  let tam = 124
  ctx.font = `${tam}px "Bebas Neue", Impact, sans-serif`
  while (ctx.measureText(N).width > W - x0 - 70 && tam > 54) {
    tam -= 4
    ctx.font = `${tam}px "Bebas Neue", Impact, sans-serif`
  }
  const yN = 160 + tam
  const metal = ctx.createLinearGradient(0, yN - tam * 0.8, 0, yN)
  metal.addColorStop(0, '#FFF8EC')
  metal.addColorStop(0.3, '#FFDCA0')
  metal.addColorStop(0.48, '#E3E6EC')
  metal.addColorStop(0.55, '#7A2028')
  metal.addColorStop(0.68, '#FF6A6E')
  metal.addColorStop(1, '#FFE0B0')
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,.7)'
  ctx.shadowOffsetY = 4
  ctx.fillStyle = metal
  ctx.fillText(N, x0, yN)
  ctx.restore()

  ctx.fillStyle = '#F5B700'
  ctx.font = '50px "Share Tech Mono", monospace'
  ctx.fillText(missaoTxt, x0, yN + 84)
  ctx.fillStyle = '#C9C3CC'
  ctx.font = '600 26px Inter, sans-serif'
  espacado(ctx, `ANIVERSÁRIO DE ${convite.crianca.idade} ANOS · ${convite.crianca.nome.toLocaleUpperCase('pt-BR')}`, x0, yN + 140, 3)
  ctx.fillStyle = '#FFF6EC'
  ctx.font = '30px "Share Tech Mono", monospace'
  ctx.fillText(`Nº ${numeroCredencial(nome)}`, x0, H - 70)

  // selo APROVADO (carimbo inclinado)
  ctx.save()
  ctx.translate(W - 210, H - 110)
  ctx.rotate(-0.14)
  ctx.strokeStyle = '#5EE09A'
  ctx.lineWidth = 6
  retArred(ctx, -150, -54, 300, 96, 10)
  ctx.stroke()
  ctx.fillStyle = '#7BF0B0'
  ctx.font = '78px "Bebas Neue", Impact, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('APROVADO', 0, 24)
  ctx.restore()
  return c
}

export async function credencialPng(nome: string) {
  const c = await desenharCredencial(nome)
  return new Promise<Blob>((ok, erro) => c.toBlob((b) => (b ? ok(b) : erro(new Error('toBlob'))), 'image/png'))
}

/** Compartilha (celular) ou baixa o PNG. Devolve a URL da imagem para a alternativa na tela. */
export async function salvarCredencial(nome: string): Promise<{ url: string; como: 'compartilhado' | 'baixado' | 'manual' }> {
  const blob = await credencialPng(nome)
  const url = URL.createObjectURL(blob)
  const nomeArq = `credencial-missao-${nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'agente'}.png`
  const arquivo = new File([blob], nomeArq, { type: 'image/png' })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  const toque = matchMedia('(pointer: coarse)').matches
  if (toque && nav.canShare?.({ files: [arquivo] })) {
    try {
      await nav.share({ files: [arquivo], title: 'Credencial da missão' })
      return { url, como: 'compartilhado' }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return { url, como: 'manual' }
    }
  }
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = nomeArq
    document.body.append(a)
    a.click()
    a.remove()
    return { url, como: 'baixado' }
  } catch {
    return { url, como: 'manual' }
  }
}
