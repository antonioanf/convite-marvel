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
    <div class="ceu" aria-hidden="true"></div>
    <main class="desk-shell">
      <div class="desk-side" style="text-align:right">
        <p class="label">${dataCurta}</p>
        <p class="hq-pop" style="margin-top:10px;font-size:76px;color:var(--color-amarelo)">${c.nome}</p>
        <p style="margin-top:12px;font-size:20px;font-weight:800;color:var(--color-marinho)">vai fazer ${c.idade} anos · ${convite.equipe.nome}</p>
      </div>
      <div class="desk-phone"><iframe title="Convite de ${c.nome}" src="${src.href}"
        allow="autoplay; clipboard-write; vibrate"></iframe></div>
      <div class="desk-side" style="color:var(--color-tinta-2);font-size:17px;font-weight:700;line-height:1.6">
        <p class="label">Feito para o celular</p>
        <p style="margin-top:10px">Abra o link no WhatsApp para a experiência completa: toque nos heróis, use os super poderes e derrote os robôs!</p>
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
