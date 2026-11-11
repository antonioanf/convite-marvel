/**
 * Parâmetros de teste pela URL:
 *  ?modo=leve | ?modo=3d       força o modo das borboletas
 *  ?agora=2026-12-12T10:00     simula a data/hora atual (testar "É hoje!" e agradecimento)
 *  ?abrir=1                    pula a intro (útil para screenshots)
 *  ?teste=1                    expõe window.__convite para os testes automáticos
 */
const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams()

export const debug = {
  modo: params.get('modo') as 'leve' | '3d' | null,
  abrir: params.get('abrir') === '1',
  teste: params.get('teste') === '1',
  offsetMs: (() => {
    const a = params.get('agora')
    if (!a) return 0
    const t = new Date(a.length <= 16 ? `${a}:00-03:00` : a).getTime()
    return Number.isFinite(t) ? t - Date.now() : 0
  })(),
}

export const now = () => Date.now() + debug.offsetMs
