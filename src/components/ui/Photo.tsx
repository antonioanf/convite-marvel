import { useState, type CSSProperties } from 'react'
import type { Foto } from '../../config/convite'
import { ButterflyIcon } from './ButterflyIcon'

/**
 * Foto com placeholder bonito (gradiente + borboleta) quando não há imagem
 * ou quando o arquivo não carrega. Respeita o ponto de foco (`foto.foco`) no recorte.
 */
export function Photo({
  foto,
  small = false,
  eager = false,
  sizes,
  fit = 'cover',
  className = '',
  imgClassName = '',
  imgStyle,
}: {
  foto: Foto
  small?: boolean
  eager?: boolean
  sizes?: string
  fit?: 'cover' | 'contain'
  className?: string
  imgClassName?: string
  imgStyle?: CSSProperties
}) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const src = small ? foto.srcPequena || foto.src : foto.src
  const showImg = !!src && !failed
  return (
    <div className={`absolute inset-0 ${className}`}>
      {(!showImg || !loaded) && (
        <div className="ph" role={showImg ? undefined : 'img'} aria-label={showImg ? undefined : foto.alt}>
          <ButterflyIcon size={64} speed={0.9} />
        </div>
      )}
      {showImg && (
        <img
          src={src}
          srcSet={foto.srcPequena && foto.src ? `${foto.srcPequena} 600w, ${foto.src} ${foto.largura ?? 1200}w` : undefined}
          sizes={sizes}
          width={foto.largura}
          height={foto.altura}
          alt={foto.alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={eager ? 'high' : 'auto'}
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${fit === 'cover' ? 'object-cover' : 'object-contain'} ${imgClassName}`}
          style={{ opacity: loaded ? 1 : 0, objectPosition: fit === 'cover' ? foto.foco : undefined, ...imgStyle }}
        />
      )}
    </div>
  )
}
