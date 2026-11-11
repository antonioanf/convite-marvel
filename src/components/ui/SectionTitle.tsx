/** Título editorial: rótulo mono + título serifado em itálico + índice "02/07". */
export function SectionTitle({ kicker, title, id, index }: { kicker: string; title: string; id?: string; index?: string }) {
  return (
    <header className="mb-5 flex items-end justify-between gap-4 px-1">
      <div className="min-w-0">
        <p className="label">{kicker}</p>
        <h2 id={id} className="serif mt-1.5 text-[44px] leading-[0.95] text-roxo">
          {title}
        </h2>
      </div>
      {index && (
        <span className="label shrink-0 pb-1" aria-hidden="true">
          {index}
        </span>
      )}
    </header>
  )
}
