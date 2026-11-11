// Revisão dos heróis: ?tela=equipe | joao | faisca | tremor | turbo | astra
import '../src/index.css'
import { convite } from '../src/config/convite'
import { temaCss } from '../src/config/tema'
import { EQUIPE, heroiSvg, type HeroiId } from '../src/lib/herois'

const p = convite.paleta
const st = document.createElement('style')
st.textContent =
  temaCss(p) +
  `body{margin:0;min-height:100svh;font-family:Nunito,system-ui,sans-serif;color:${p.marinho};
   background:radial-gradient(circle,rgb(255 255 255/.55) 1.4px,transparent 1.9px) 0 0/12px 12px,linear-gradient(180deg,${p.ceu},#E3F2FF)}
   .t{font-family:Bangers,Impact,sans-serif;letter-spacing:.05em;text-align:center;margin:0}
   .equipe{position:relative;height:500px;max-width:430px;margin:0 auto}
   .equipe>div{position:absolute}
   .raios{position:absolute;inset:-20% -30%;background:repeating-conic-gradient(from 0deg at 50% 60%,rgb(255 214 10/.35) 0 6deg,transparent 6deg 15deg);
     -webkit-mask:radial-gradient(closest-side,#000 30%,transparent 75%);mask:radial-gradient(closest-side,#000 30%,transparent 75%)}
   .poses{display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 0 0}
   .poses>div{height:calc((100svh - 150px) / 2);aspect-ratio:260/290;max-width:92vw}.poses svg{width:100%;height:100%}
   .h-olhos{animation:none!important}.tag{display:inline-block;background:${p.amarelo};border:3px solid ${p.marinho};border-radius:10px;padding:2px 12px;font-family:Bangers;font-size:20px;letter-spacing:.06em}`
document.head.appendChild(st)
const fonts = document.createElement('style')
fonts.textContent = `@font-face{font-family:Bangers;src:url(/fonts/bangers.woff2)}@font-face{font-family:Nunito;font-weight:200 1000;src:url(/fonts/nunito.woff2)}`
document.head.appendChild(fonts)

const tela = new URLSearchParams(location.search).get('tela') ?? 'equipe'
const el = document.getElementById('tela')!
const svg = (id: HeroiId, pose: 'normal' | 'ataque', delay = 0) =>
  heroiSvg(id, pose, p, { attrs: `width="100%" style="--pisca:${delay}s"` })

if (tela === 'equipe') {
  // como na pose de equipe do hero: João no centro e maior, Faísca e Astra atrás, Tremor e Turbo na frente
  const pos: [HeroiId, number, number, number, number][] = [
    ['faisca', -3, 0, 40, 1],
    ['astra', 63, 0, 40, 1],
    ['tremor', -7, 190, 46, 3],
    ['turbo', 62, 176, 44, 3],
    ['joao', 16, 50, 68, 2],
  ]
  el.innerHTML =
    `<p class="t" style="font-size:40px;padding-top:24px">${convite.equipe.nome}</p>` +
    `<div class="equipe"><span class="raios"></span>` +
    pos.map(([id, l, t, w, z], i) => `<div style="left:${l}%;top:${t}px;width:${w}%;z-index:${z}">${svg(id, 'normal', -i * 0.9)}</div>`).join('') +
    `</div><p class="t" style="font-size:22px;margin-top:10px;padding:0 16px">João Lucas no centro · Faísca, Astra, Tremor e Turbo</p>`
} else {
  const h = EQUIPE[tela as HeroiId]
  el.innerHTML =
    `<div class="poses"><p class="t" style="font-size:38px">${h.nome}</p><span class="tag">${h.titulo}</span>` +
    `<div>${svg(h.id, 'normal')}</div><span class="tag">ATAQUE!</span><div>${svg(h.id, 'ataque')}</div></div>`
}
