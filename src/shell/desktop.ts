/**
 * Desktop: mostra o próprio convite (versão mobile) dentro de uma moldura de celular,
 * com o céu da HQ ao redor. Não existe layout desktop separado.
 */
import { convite } from '../config/convite'
import { dataCurta } from '../lib/datas'

export function mountDesktop() {
  document.getElementById('intro')?.remove()
  const root = document.getElementById('root')!
  const src = new URL(location.href)
  const c = convite.crianca
  root.innerHTML = `
    <div class="cena" aria-hidden="true"></div>
    <main class="desk-shell">
      <div class="desk-side" style="text-align:right">
        <p class="rotulo">${dataCurta}</p>
        <p class="display metal" style="margin-top:10px;font-size:88px">${c.nome}</p>
        <p style="margin-top:12px;font-size:20px;font-weight:800;color:var(--color-branco)">vai fazer ${c.idade} anos</p>
      </div>
      <div class="desk-phone"><iframe title="Convite de ${c.nome}" src="${src.href}"
        allow="autoplay; clipboard-write; vibrate"></iframe></div>
      <div class="desk-side" style="color:var(--color-branco-2);font-size:16px;font-weight:500;line-height:1.6">
        <p class="rotulo">Feito para o celular</p>
        <p style="margin-top:10px">Abra o link no WhatsApp para a experiência completa: use os poderes e aceite a missão.</p>
      </div>
    </main>`
  const phone = root.querySelector<HTMLElement>('.desk-phone')!
  const sides = root.querySelectorAll<HTMLElement>('.desk-side')
  const fit = () => {
    const s = Math.min(1, (innerHeight - 40) / 868)
    phone.style.transform = `scale(${s})`
    phone.style.margin = `${(-868 * (1 - s)) / 2}px ${(-414 * (1 - s)) / 2}px`
    const narrow = innerWidth < 1100
    sides.forEach((el) => (el.style.display = narrow ? 'none' : ''))
  }
  fit()
  addEventListener('resize', fit)
}
