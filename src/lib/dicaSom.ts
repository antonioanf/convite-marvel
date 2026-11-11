/**
 * Dica "Ative o som do iPhone 🔊": no iPhone, a chave de silencioso corta o Web Audio (a trilha e
 * os efeitos ficam mudos sem aviso). Aparece uma vez só (fica guardado no aparelho), por ~5 s,
 * logo acima da barra de baixo, quando a abertura termina.
 */
import { som } from './audio'

const CHAVE = 'convite:dica-som'

export const ehIOS = () =>
  typeof navigator !== 'undefined' && (/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1))

export function mostrarDicaSom(atraso = 1400) {
  if (!ehIOS() || !som.available) return
  try {
    if (localStorage.getItem(CHAVE)) return
    localStorage.setItem(CHAVE, '1')
  } catch {
    /* sem armazenamento: mostra mesmo assim */
  }
  setTimeout(() => {
    if (som.isMuted()) return
    const el = document.createElement('div')
    el.className = 'dica-som'
    el.setAttribute('role', 'status')
    el.textContent = 'Ative o som do iPhone 🔊'
    document.body.append(el)
    requestAnimationFrame(() => el.classList.add('on'))
    const fechar = () => {
      el.classList.remove('on')
      setTimeout(() => el.remove(), 500)
    }
    el.addEventListener('click', fechar)
    setTimeout(fechar, 5200)
  }, atraso)
}
