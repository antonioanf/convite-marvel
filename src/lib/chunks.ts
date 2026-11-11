/**
 * import() com novas tentativas para os chunks dos efeitos.
 * O Safari (e outros) guarda a falha de um import() — repetir o mesmo import nem vai à rede.
 * Por isso a 2ª e a 3ª tentativas pedem o arquivo por outro endereço (`?tentativa=N`): o nome do
 * arquivo de cada chunk vem do build (vite.config.ts → __CHUNKS__).
 */
import { diag } from './diag'

declare const __CHUNKS__: Record<string, string>

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function importarComRetry<T>(nome: string, importar: () => Promise<T>, tentativas = 3): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      const arquivo = typeof __CHUNKS__ !== 'undefined' ? __CHUNKS__[nome] : undefined
      if (i === 0 || import.meta.env.DEV || !arquivo) return await importar()
      return (await import(/* @vite-ignore */ `${import.meta.env.BASE_URL}${arquivo}?tentativa=${i + 1}`)) as T
    } catch (e) {
      diag.erro(`chunk ${nome} (tentativa ${i + 1})`, e)
      if (i >= tentativas - 1) throw e
      await espera(700 * (i + 1) ** 2)
    }
  }
}
