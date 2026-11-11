/**
 * Painel de diagnóstico (?debug=1), no canto de cima da tela, para tirar print:
 * motor dos poderes (WebGL / 2D), estado do áudio, reduced-motion, último gesto e erros.
 * Não recebe toques (pointer-events: none), então não atrapalha os gestos.
 */
import { diag } from './diag'
import { som } from './audio'
import { perf } from './perf'
import { ehIOS } from './dicaSom'

export function iniciarPainelDiag() {
  const el = document.createElement('div')
  el.className = 'painel-diag'
  el.setAttribute('aria-hidden', 'true')
  document.body.append(el)

  const linha = (k: string, v: string, ruim = false) => `<div><b>${k}</b> <span${ruim ? ' class="ruim"' : ''}>${v}</span></div>`
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)
  const pintar = () => {
    const temWebAudio = 'AudioContext' in window || 'webkitAudioContext' in window
    const estado = som.estado()
    const audio = !temWebAudio ? 'navegador sem Web Audio' : estado === 'sem contexto' ? 'ainda não liberado (falta um toque)' : estado
    el.innerHTML = [
      linha('efeitos', diag.motor === '—' ? 'ainda não carregado (role até PODERES)' : diag.motor, /2d|brilho/.test(diag.motor)),
      linha('webgl no aparelho', perf.temWebgl() ? 'sim' : 'não', !perf.temWebgl()),
      linha('áudio', `${audio}${som.isMuted() ? ' (mudo)' : ''}`, audio !== 'running'),
      linha('reduced-motion', perf.reducedMotion ? 'sim (efeitos viram brilho)' : 'não', perf.reducedMotion),
      linha('modo', perf.isLite() ? 'leve' : 'normal'),
      linha('último gesto', esc(diag.ultimoGesto)),
      linha('iOS', ehIOS() ? 'sim' : 'não'),
      diag.erros.length ? `<div class="ruim"><b>erros</b><br>${diag.erros.map(esc).join('<br>')}</div>` : linha('erros', 'nenhum'),
    ].join('')
  }
  pintar()
  diag.subscribe(pintar)
  som.subscribe(pintar)
  // o estado do áudio muda sem aviso em alguns navegadores: confere a cada segundo
  setInterval(pintar, 1000)
}
