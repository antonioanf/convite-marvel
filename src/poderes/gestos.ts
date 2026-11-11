/**
 * Reconhece os gestos dos poderes no convite inteiro (menos sobre campos de texto, botões e links):
 *   TEMPESTADE  arrasto rápido para baixo partindo do alto da tela → o raio cai onde o dedo parou
 *   IMPACTO     toque duplo num ponto
 *   RAJADA      segurar (carrega) e soltar (dispara); segurar bem longo (> 2,6 s) vira ENERGIA CÓSMICA
 *   MAGIA       girar o dedo em círculos (mais de 1,5 volta) → a névoa segue o dedo
 *   PORTAL      desenhar UM círculo fechado e soltar
 *   CÓSMICA     segurar com dois dedos parados
 * Toque com Touch Events passivos (a rolagem vertical nativa continua igual) e mouse com Pointer Events.
 * Por que Touch Events no dedo (e não Pointer Events): no Safari do iPhone, assim que a página
 * começa a rolar, o navegador manda pointercancel e o gesto morre (um círculo ou o arrasto da
 * Tempestade quase sempre mexe um pouco na vertical). Os Touch Events continuam chegando durante a
 * rolagem, em iOS e Android. O CSS (touch-action no html) tira o zoom de toque duplo.
 * Toques que começam a menos de 20 px das bordas laterais são ignorados: é ali que o Safari
 * faz o gesto de voltar/avançar.
 * Também deixa o rastro de faíscas elétricas leves do dedo (canvas 2D).
 */
import { acionar, carregarMotor } from './acionar'
import { fx2d } from '../lib/fx/camada2d'
import { perf } from '../lib/perf'
import { diag } from '../lib/diag'

interface Amostra {
  x: number
  y: number
  t: number
}
interface Gesto {
  x0: number
  y0: number
  t0: number
  x: number
  y: number
  pts: Amostra[]
  giro: number
  ang: number | null
  rastro: number
  estado: 'livre' | 'carga' | 'magia' | 'feito'
  hold: number
}

const SEGURAR_MS = 420
/** faixa das bordas laterais reservada ao gesto de voltar/avançar do Safari */
const BORDA = 20
const BLOQUEIO = 'input, textarea, select, button, a, label, [role="button"], .btn, [data-sem-gesto]'

const bloqueado = (alvo: EventTarget | null) => {
  const h = document.documentElement
  if (h.classList.contains('pre') || h.classList.contains('desk')) return true
  return alvo instanceof Element && !!alvo.closest(BLOQUEIO)
}

const ajusta = (a: number) => (a > Math.PI ? a - 2 * Math.PI : a < -Math.PI ? a + 2 * Math.PI : a)

let g: Gesto | null = null
let ultimoToque: Amostra | null = null
let menuBloqueado = false
// dois dedos
let dois: { x: number; y: number; ax: number; ay: number; bx: number; by: number; timer: number; ativo: boolean } | null = null

/** `t` = hora em que o toque aconteceu (event.timeStamp): com a página ocupada, os eventos chegam
 *  atrasados, mas a velocidade do gesto continua certa. */
function comecar(x: number, y: number, t = performance.now()) {
  g = { x0: x, y0: y, t0: t, x, y, pts: [{ x, y, t }], giro: 0, ang: null, rastro: 0, estado: 'livre', hold: 0 }
  const atual = g
  atual.hold = window.setTimeout(() => {
    if (g !== atual || atual.estado !== 'livre') return
    atual.estado = 'carga'
    diag.gesto('segurar (rajada)')
    menuBloqueado = true
    acionar.carga({ x: atual.x, y: atual.y })
  }, SEGURAR_MS)
}

function mover(x: number, y: number, t = performance.now()) {
  if (!g) return
  const dx = x - g.x
  const dy = y - g.y
  const passo = Math.hypot(dx, dy)
  g.x = x
  g.y = y
  if (g.estado === 'livre' && Math.hypot(x - g.x0, y - g.y0) > 12) clearTimeout(g.hold)

  // giro acumulado (para círculos): só com amostras a cada 8 px
  const u = g.pts[g.pts.length - 1]
  if (Math.hypot(x - u.x, y - u.y) >= 8) {
    const ang = Math.atan2(y - u.y, x - u.x)
    if (g.ang !== null) g.giro += ajusta(ang - g.ang)
    g.ang = ang
    g.pts.push({ x, y, t })
    if (g.pts.length > 160) g.pts.splice(1, 1)
    // parece um círculo se formando: o motor já começa a baixar
    if (Math.abs(g.giro) > Math.PI) void carregarMotor()
  }

  if (g.estado === 'livre' && Math.abs(g.giro) >= Math.PI * 3) {
    const r = raioMedio(g.pts.slice(-40))
    if (r > 18 && r < 220) {
      g.estado = 'magia'
      diag.gesto('círculos (magia)')
    }
  }
  if (g.estado === 'magia') acionar.magia({ x, y })
  else if (g.estado === 'carga') acionar.cargaMover({ x, y })
  else if (!perf.reducedMotion) {
    // rastro de faíscas elétricas leves
    g.rastro += passo
    if (g.rastro > 26) {
      g.rastro = 0
      fx2d.faiscas(x, y, perf.isLite() ? 1 : 2, { tipo: 0, forca: 90, vida: 0.35 })
    }
  }
}

function raioMedio(pts: Amostra[]) {
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length
  return pts.reduce((s, p) => s + Math.hypot(p.x - cx, p.y - cy), 0) / pts.length
}

function terminar(cancelado = false, tEv = performance.now()) {
  if (!g) return
  const e = g
  g = null
  clearTimeout(e.hold)
  menuBloqueado = false
  if (e.estado === 'carga') {
    if (cancelado) acionar.cargaCancelar()
    else acionar.cargaSoltar()
    return
  }
  if (e.estado === 'magia') {
    acionar.magiaFim()
    return
  }
  if (cancelado || e.estado !== 'livre') return
  const t = tEv
  const dur = t - e.t0
  const dx = e.x - e.x0
  const dy = e.y - e.y0
  const H = innerHeight

  // TEMPESTADE: rápido, para baixo, saindo do alto da tela
  if (e.y0 < H * 0.4 && dy > 110 && Math.abs(dx) < dy * 0.7 && dur < 520 && dy / dur > 0.45) {
    diag.gesto('arrasto p/ baixo (tempestade)')
    acionar.tempestade({ x: e.x, y: e.y })
    return
  }
  // PORTAL: uma volta fechada
  const volta = Math.abs(e.giro)
  if (volta > Math.PI * 1.6 && e.pts.length > 10) {
    const xs = e.pts.map((p) => p.x)
    const ys = e.pts.map((p) => p.y)
    const diam = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys))
    const fecha = Math.hypot(dx, dy)
    if (diam > 80 && fecha < Math.max(45, diam * 0.5)) {
      const cx = xs.reduce((a, b) => a + b, 0) / xs.length
      const cy = ys.reduce((a, b) => a + b, 0) / ys.length
      diag.gesto('círculo fechado (portal)')
      acionar.portal({ x: cx, y: cy }, raioMedio(e.pts))
      return
    }
  }
  // IMPACTO: dois toques curtos no mesmo lugar
  if (dur < 260 && Math.hypot(dx, dy) < 14) {
    const u = ultimoToque
    if (u && t - u.t < 340 && Math.hypot(e.x - u.x, e.y - u.y) < 46) {
      ultimoToque = null
      diag.gesto('toque duplo (impacto)')
      acionar.impacto({ x: e.x, y: e.y })
    } else {
      ultimoToque = { x: e.x, y: e.y, t }
      void carregarMotor() // pode ser o primeiro de um toque duplo
    }
  }
}

/* ---------- dois dedos: ENERGIA CÓSMICA ---------- */
function doisComecar(a: Touch, b: Touch) {
  // o gesto de um dedo que estava em andamento é cancelado
  if (g) terminar(true)
  const x = (a.clientX + b.clientX) / 2
  const y = (a.clientY + b.clientY) / 2
  dois = { x, y, ax: a.clientX, ay: a.clientY, bx: b.clientX, by: b.clientY, ativo: false, timer: 0 }
  const d = dois
  d.timer = window.setTimeout(() => {
    if (dois !== d) return
    d.ativo = true
    diag.gesto('dois dedos (cósmica)')
    acionar.cosmico({ x: d.x, y: d.y })
  }, 450)
  void carregarMotor()
}
function doisMover(a: Touch, b: Touch) {
  if (!dois) return
  const d = dois
  const moveu = Math.max(Math.hypot(a.clientX - d.ax, a.clientY - d.ay), Math.hypot(b.clientX - d.bx, b.clientY - d.by))
  d.x = (a.clientX + b.clientX) / 2
  d.y = (a.clientY + b.clientY) / 2
  if (d.ativo) acionar.cosmicoMover({ x: d.x, y: d.y })
  else if (moveu > 24) {
    // é pinça (zoom), não poder
    clearTimeout(d.timer)
    dois = null
  }
}
function doisTerminar() {
  if (!dois) return
  clearTimeout(dois.timer)
  if (dois.ativo) acionar.cosmicoSoltar()
  dois = null
}

let ligado = false
export function iniciarGestos() {
  if (ligado) return
  ligado = true
  const op = { passive: true, capture: true } as const
  let ignorar = false
  document.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length === 1) {
        const x = e.touches[0].clientX
        ignorar = bloqueado(e.target) || x < BORDA || x > innerWidth - BORDA
        if (!ignorar) comecar(e.touches[0].clientX, e.touches[0].clientY, e.timeStamp)
      } else if (e.touches.length === 2 && !ignorar) doisComecar(e.touches[0], e.touches[1])
      else {
        terminar(true)
        doisTerminar()
      }
    },
    op,
  )
  document.addEventListener(
    'touchmove',
    (e) => {
      if (ignorar) return
      if (dois && e.touches.length >= 2) doisMover(e.touches[0], e.touches[1])
      else if (g && e.touches.length === 1) mover(e.touches[0].clientX, e.touches[0].clientY, e.timeStamp)
    },
    op,
  )
  const fim = (e: TouchEvent) => {
    if (dois) doisTerminar()
    else if (e.touches.length === 0) terminar(e.type === 'touchcancel' && g?.estado === 'livre', e.timeStamp)
    if (e.touches.length === 0) ignorar = false
  }
  document.addEventListener('touchend', fim, op)
  document.addEventListener('touchcancel', fim, op)

  // mouse (desktop, dentro da moldura de celular)
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || bloqueado(e.target)) return
      comecar(e.clientX, e.clientY, e.timeStamp)
    },
    op,
  )
  document.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'mouse' && g) mover(e.clientX, e.clientY, e.timeStamp)
    },
    op,
  )
  document.addEventListener(
    'pointerup',
    (e) => {
      if (e.pointerType === 'mouse') terminar(false, e.timeStamp)
    },
    op,
  )
  // segurando para carregar: sem menu de toque longo
  document.addEventListener('contextmenu', (e) => {
    if (menuBloqueado || g?.estado === 'carga') e.preventDefault()
  })
}
