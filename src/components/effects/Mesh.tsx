/**
 * Fundo: gradiente mesh perolado com manchas lilás/rosa/ciano se movendo devagar + grão.
 * Desempenho: as 4 manchas ficam num único elemento (uma camada animada só com transform)
 * e o grão faz parte do fundo da base — antes eram 6 camadas do tamanho da tela.
 */
export function Mesh() {
  return (
    <div className="mesh" aria-hidden="true">
      <div className="mesh-inner">
        <div className="mesh-blobs" />
      </div>
    </div>
  )
}
