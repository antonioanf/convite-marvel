/** Título de seção estilo trailer: rótulo na cor da seção + título em metal + índice "02/05". */
export function SectionTitle({ kicker, title, id, index }: { kicker: string; title: string; id?: string; index?: string }) {
  return (
    <header className="secao-titulo">
      <div className="min-w-0">
        <p className="rotulo acc-txt">{kicker}</p>
        <h2 id={id} className="display metal mt-1">
          {title}
        </h2>
        <span className="linha" aria-hidden="true" />
      </div>
      {index && (
        <span className="mono shrink-0 pb-2 text-[13px] tracking-[0.2em] text-branco" aria-hidden="true">
          {index}
        </span>
      )}
    </header>
  )
}
