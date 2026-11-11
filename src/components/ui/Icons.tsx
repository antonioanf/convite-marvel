/** Ícones de linha finos, desenhados à mão (sem biblioteca). 24x24, traço 1.6. */
const paths = {
  calendario: 'M7 3v3M17 3v3M3.5 9h17M5.5 5h13a2 2 0 0 1 2 2v11.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01',
  relogio: 'M12 7.5V12l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  pin: 'M12 21s-6.5-5.8-6.5-11a6.5 6.5 0 0 1 13 0c0 5.2-6.5 11-6.5 11zM12 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z',
  seta: 'M4 11.5l16-7-7 16-2-7-7-2z',
  mais: 'M12 8.5v7M8.5 12h7M5.5 4h13a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  copiar: 'M9 9h10.5v10.5H9zM15 9V4.5H4.5V15H9',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  sol: 'M12 4V2.5M12 21.5V20M4 12H2.5M21.5 12H20M6.3 6.3L5.2 5.2M18.8 18.8l-1.1-1.1M6.3 17.7l-1.1 1.1M18.8 5.2l-1.1 1.1M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z',
  presente: 'M4 11h16v9.5H4zM3 7.5h18V11H3zM12 7.5v13M12 7.5S10.5 3.5 8 4s-1 3.5 4 3.5zM12 7.5s1.5-4 4-3.5 1 3.5-4 3.5z',
  microfone: 'M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zM6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v3.5',
  whatsapp: 'M4 20l1.2-3.6A8 8 0 1 1 8 19zM9 9.2c.3 2.5 2.3 4.6 4.8 5l1-1.1 2 .9-.3 1.4c-3.8.4-7.6-3.3-7.3-7.2l1.4-.3.9 2z',
  fechar: 'M6 6l12 12M18 6L6 18',
} as const

export type IconName = keyof typeof paths

export function Icon({ name, size = 22, className = '' }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}

/** Ícone dentro de um quadradinho com gradiente suave. */
export function IconTile({ name }: { name: IconName }) {
  return (
    <span className="ico">
      <Icon name={name} />
    </span>
  )
}
