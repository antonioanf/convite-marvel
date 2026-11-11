/**
 * Diagnóstico (?debug=1): um registro pequeno que o áudio, o motor dos poderes e os gestos
 * alimentam. O painel (lib/painelDiag.ts) só é carregado com ?debug=1 e lê daqui.
 * Fora do modo debug, só guarda os últimos valores (custo desprezível).
 */
type Listener = () => void

const listeners = new Set<Listener>()
const avisar = () => listeners.forEach((l) => l())

export const diag = {
  ativo: typeof location !== 'undefined' && new URLSearchParams(location.search).get('debug') === '1',
  /** 'webgl' | '2d' | 'brilho' (sem motor) | 'carregando' | '—' */
  motor: '—',
  ultimoGesto: '—',
  erros: [] as string[],
  setMotor(m: string) {
    diag.motor = m
    avisar()
  },
  gesto(nome: string) {
    diag.ultimoGesto = `${nome} · ${new Date().toLocaleTimeString('pt-BR')}`
    avisar()
  },
  erro(onde: string, e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    diag.erros.push(`${onde}: ${msg}`.slice(0, 160))
    if (diag.erros.length > 6) diag.erros.shift()
    avisar()
  },
  subscribe(l: Listener) {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
}

// no modo debug, captura também os erros soltos (desde o começo da página)
if (diag.ativo && typeof window !== 'undefined') {
  addEventListener('error', (e) => diag.erro('erro', e.error ?? e.message))
  addEventListener('unhandledrejection', (e) => diag.erro('promessa', e.reason))
}
