/**
 * Atmosfera do pôster do hero (canvas 2D, resolução 1x — é fundo): brasas e poeira nascem ENTRE AS
 * ROCHAS (faixa de baixo do pôster) e sobem, sumindo antes de chegar ao título — nenhuma partícula
 * passa por cima de texto. Relâmpagos distantes de vez em quando no céu (metade de cima).
 * As brasas mudam de cor ao esfriar (amarelo → laranja → vermelho escuro).
 * O laço para com o pôster fora da tela, com a aba em segundo plano ou com um poder ativo.
 */
import { perf } from '../perf'
import { sfx } from '../sfx'
import { desenharRaio2D, gerarRaio, type Raio } from './raio'
import { CLARAO_MAX, podeClarear } from './clarao'
import { fundo } from './fundo'

interface P {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vida: number
  max: number
  seed: number
  brasa: boolean
}

function sprite(stops: [number, string][], tam = 64) {
  const c = document.createElement('canvas')
  c.width = c.height = tam
  const g = c.getContext('2d')!
  const rg = g.createRadialGradient(tam / 2, tam / 2, 0, tam / 2, tam / 2, tam / 2)
  stops.forEach(([o, cor]) => rg.addColorStop(o, cor))
  g.fillStyle = rg
  g.fillRect(0, 0, tam, tam)
  return c
}

/** `faixa` = altura (px) da faixa das rochas, no pé do canvas, onde as partículas nascem. */
export function iniciarAtmosfera(canvas: HTMLCanvasElement, flash: HTMLElement, faixa = 130) {
  const ctx = canvas.getContext('2d')!
  let W = 0
  let H = 0
  const resize = () => {
    W = canvas.clientWidth || innerWidth
    H = canvas.clientHeight || innerHeight
    canvas.width = W
    canvas.height = H
  }
  resize()
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  // as partículas sobem no máximo até aqui (acima das rochas) e já chegam apagadas
  const teto = () => H - faixa - 150

  // brasas: quente (amarelo-branco), média (laranja), fria (vermelho escuro); poeira: dourada (luz do
  // entardecer); bokeh: disco macio dourado ou rosado (luz desfocada perto da "câmera")
  const quente = sprite([[0, 'rgba(255,245,210,1)'], [0.2, 'rgba(255,200,110,.9)'], [0.45, 'rgba(255,120,30,.3)'], [1, 'rgba(255,80,0,0)']])
  const media = sprite([[0, 'rgba(255,190,110,1)'], [0.2, 'rgba(255,120,40,.8)'], [0.5, 'rgba(220,60,10,.25)'], [1, 'rgba(180,30,0,0)']])
  const fria = sprite([[0, 'rgba(230,80,30,.9)'], [0.3, 'rgba(160,30,10,.4)'], [1, 'rgba(100,10,0,0)']])
  const poeira = sprite([[0, 'rgba(255,230,170,.95)'], [0.4, 'rgba(245,183,60,.3)'], [1, 'rgba(230,140,40,0)']])
  const bokeh = sprite([[0, 'rgba(255,200,120,.34)'], [0.7, 'rgba(255,170,90,.2)'], [0.85, 'rgba(255,150,90,.07)'], [1, 'rgba(255,150,90,0)']])

  const nova = (brasa: boolean, inicio = false): P => {
    const z = Math.random()
    return {
      x: Math.random() * W,
      // nascem entre as rochas
      y: H - Math.random() * faixa * (brasa && !inicio ? 0.5 : 1),
      z,
      vx: (Math.random() - 0.5) * 10,
      vy: brasa ? -(18 + z * 40 + Math.random() * 20) : -(2 + Math.random() * 5),
      vida: inicio ? Math.random() * 6 : 0,
      max: brasa ? 6 + Math.random() * 6 : 1e9,
      seed: Math.random() * 100,
      brasa,
    }
  }
  // modo leve: menos brasas e menos poeira (as de longe somem primeiro)
  const quantos = () => (perf.isLite() ? { brasas: 6, poeira: 6 } : { brasas: 16, poeira: 18 })
  const ps: P[] = []
  const ajustar = () => {
    const q = quantos()
    const brasas = ps.filter((p) => p.brasa)
    const poeiras = ps.filter((p) => !p.brasa).sort((x, y) => y.z - x.z)
    ps.length = 0
    ps.push(...brasas.slice(0, q.brasas), ...poeiras.slice(0, q.poeira))
    while (ps.filter((p) => p.brasa).length < q.brasas) ps.push(nova(true, true))
    while (ps.filter((p) => !p.brasa).length < q.poeira) ps.push(nova(false, true))
  }
  ajustar()
  const offLite = perf.subscribe(ajustar)
  // mede o FPS nos primeiros segundos: se o aparelho não aguentar, liga o modo leve sozinho
  let medindo = { n: 0, t0: 0 }

  let raio: { r: Raio; t0: number } | null = null
  let ultimo = performance.now()
  let raf = 0
  let ativo = true

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame)
    // modo leve: brasas e poeira a ~30 quadros por segundo (metade do trabalho, movimento lento igual)
    if (perf.isLite() && now - ultimo < 30) return
    const dt = Math.min(0.05, (now - ultimo) / 1000)
    ultimo = now
    if (medindo.n >= 0) {
      if (!medindo.t0) medindo.t0 = now
      medindo.n++
      if (now - medindo.t0 > 4000) {
        const fps = (medindo.n * 1000) / (now - medindo.t0)
        if (fps < 45) perf.downgrade(`fundo a ${fps.toFixed(0)} fps`)
        medindo = { n: -1, t0: 0 }
      }
    }
    const t = now / 1000
    ctx.clearRect(0, 0, W, H)
    if (raio) {
      if (t - raio.t0 > 0.9) raio = null
      else desenharRaio2D(ctx, raio.r, t - raio.t0, 1.4)
    }
    ctx.globalCompositeOperation = 'lighter'
    for (const p of ps) {
      p.vida += dt
      // balanço suave (vento) + subida
      p.x += (p.vx + Math.sin(t * 0.7 + p.seed) * (p.brasa ? 14 : 6)) * dt
      p.y += p.vy * dt
      if (p.brasa) {
        if (p.vida > p.max || p.y < teto()) Object.assign(p, nova(true))
        const k = p.vida / p.max
        const sobe = Math.min(1, Math.max(0, (p.y - teto()) / 150)) // apaga ao subir acima das rochas
        const flick = 0.75 + 0.25 * Math.sin(t * 13 + p.seed * 7)
        const tam = (1.5 + p.z * 3.2) * (1 - k * 0.4)
        const s = tam * 3.2
        ctx.globalAlpha = Math.max(0, Math.min(1, (1 - k) * 1.4) * flick * (0.35 + p.z * 0.65) * sobe)
        ctx.drawImage(k < 0.35 ? quente : k < 0.7 ? media : fria, p.x - s, p.y - s, s * 2, s * 2)
      } else {
        if (p.y < teto()) p.y = H + 10
        if (p.x < -30) p.x = W + 30
        if (p.x > W + 30) p.x = -30
        if (p.z > 0.82) {
          // muito perto da "câmera": disco grande e desfocado (bokeh)
          const s = 10 + p.z * 16
          ctx.globalAlpha = (0.18 + 0.12 * Math.sin(t * 0.5 + p.seed)) * Math.min(1, Math.max(0, (p.y - teto()) / 150))
          ctx.drawImage(bokeh, p.x - s, p.y - s, s * 2, s * 2)
        } else {
          const s = 1 + p.z * 2.4
          ctx.globalAlpha = (0.2 + p.z * 0.35) * Math.min(1, Math.max(0, (p.y - teto()) / 150))
          ctx.drawImage(poeira, p.x - s * 2, p.y - s * 2, s * 4, s * 4)
        }
      }
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  // relâmpago distante: raio fraco atrás das nuvens + céu clareando + trovão longe
  let timer = 0
  const relampago = () => {
    if (!ativo || document.hidden) return agenda()
    const x0 = W * (0.1 + Math.random() * 0.8)
    raio = { r: gerarRaio({ x: x0, y: -10 }, { x: x0 + (Math.random() - 0.5) * W * 0.5, y: H * (0.18 + Math.random() * 0.14) }, { niveis: 8, galhos: 1.4 }), t0: performance.now() / 1000 }
    if (podeClarear()) {
      flash.animate(
        [{ opacity: 0 }, { opacity: CLARAO_MAX * 0.4, offset: 0.1 }, { opacity: CLARAO_MAX * 0.1, offset: 0.3 }, { opacity: CLARAO_MAX * 0.3, offset: 0.42 }, { opacity: 0 }],
        { duration: 700, easing: 'ease-out' },
      )
    }
    setTimeout(() => sfx.trovao(0.25), 300 + Math.random() * 700) // som atrasa: o raio está longe
    agenda()
  }
  const agenda = () => {
    timer = window.setTimeout(relampago, 9000 + Math.random() * 9000)
  }

  if (perf.reducedMotion) {
    // sem movimento: um único quadro parado da atmosfera
    frame(performance.now())
    cancelAnimationFrame(raf)
  } else {
    raf = requestAnimationFrame(frame)
    timer = window.setTimeout(relampago, 4000)
  }
  // pausa enquanto um poder está ativo, com a aba em segundo plano ou com o pôster fora da tela
  let porPoder = false
  let porAba = false
  let porTela = false
  const io = new IntersectionObserver(([e]) => {
    porTela = !e.isIntersecting
    aplicar()
  })
  io.observe(canvas)
  const aplicar = () => {
    const p = porPoder || porAba || porTela
    ativo = !p
    cancelAnimationFrame(raf)
    if (!p && !perf.reducedMotion) {
      ultimo = performance.now()
      raf = requestAnimationFrame(frame)
    }
  }
  const offFundo = fundo.ouvir((p) => {
    porPoder = p
    aplicar()
  })
  return {
    pausar(p: boolean) {
      porAba = p
      aplicar()
    },
    parar() {
      ativo = false
      cancelAnimationFrame(raf)
      clearTimeout(timer)
      ro.disconnect()
      io.disconnect()
      offLite()
      offFundo()
    },
  }
}
