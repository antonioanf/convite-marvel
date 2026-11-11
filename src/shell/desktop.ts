/**
 * Desktop: mostra o próprio convite (versão mobile) dentro de uma moldura de celular,
 * com o fundo perolado ao redor. Não existe layout desktop separado.
 */
import { convite } from '../config/convite'
import { dataCurta } from '../lib/datas'

export function mountDesktop() {
  document.getElementById('intro')?.remove()
  const root = document.getElementById('root')!
  const src = new URL(location.href)
  const c = convite.crianca
  root.innerHTML = `
    <div class="mesh" aria-hidden="true"><div class="mesh-inner"><div class="mesh-blobs"></div></div></div>
    <main class="desk-shell">
      <div class="desk-side" style="text-align:right">
        <p class="label">${dataCurta}</p>
        <p class="serif" style="margin-top:10px;font-size:72px;line-height:.95;color:var(--color-roxo)">${c.nome}</p>
        <p style="margin-top:12px;font-size:18px;font-weight:600;color:var(--color-tinta-2)">vai fazer ${c.idade} aninhos 🦋</p>
      </div>
      <div class="desk-phone"><iframe title="Convite de ${c.nome}" src="${src.href}"
        allow="autoplay; clipboard-write; accelerometer; gyroscope; vibrate; microphone"></iframe></div>
      <div class="desk-side" style="color:var(--color-tinta-2);font-size:16px;font-weight:500;line-height:1.6">
        <p class="label">Feito para o celular</p>
        <p style="margin-top:10px">Abra o link no WhatsApp para a experiência completa: toque nas borboletas, raspe a data e apague as velinhas ✨</p>
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
