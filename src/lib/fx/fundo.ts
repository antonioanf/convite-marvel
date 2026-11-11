/**
 * Pausa central dos efeitos de fundo (atmosfera, nuvens, eletricidade do título) enquanto um poder
 * está na tela — o poder fica com a GPU/CPU só para ele. Também pausa com a aba em segundo plano.
 * Uso: const soltar = fundo.pausar() ... soltar()   (vários poderes podem pausar ao mesmo tempo)
 */
type L = (pausado: boolean) => void

let pedidos = 0
const ls = new Set<L>()

function emitir() {
  const p = pedidos > 0
  if (typeof document !== 'undefined') document.documentElement.classList.toggle('poder-ativo', p)
  ls.forEach((l) => l(p))
}

export const fundo = {
  pausado: () => pedidos > 0,
  pausar() {
    pedidos++
    if (pedidos === 1) emitir()
    let solto = false
    return () => {
      if (solto) return
      solto = true
      pedidos = Math.max(0, pedidos - 1)
      if (pedidos === 0) emitir()
    }
  },
  ouvir(l: L) {
    ls.add(l)
    return () => {
      ls.delete(l)
    }
  },
}
