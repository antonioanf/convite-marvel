/** Estado mínimo compartilhado entre a intro (JS puro) e o app React. */
type Listener = () => void

let opened = false
const listeners = new Set<Listener>()
let markMounted: () => void = () => {}
const mounted = new Promise<void>((r) => (markMounted = r))

export const appState = {
  /** O app React terminou a primeira montagem (chamado pelo App). */
  mounted: () => markMounted(),
  whenMounted: () => mounted,
  isOpened: () => opened,
  open() {
    if (opened) return
    opened = true
    listeners.forEach((l) => l())
  },
  subscribe(l: Listener) {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
}
