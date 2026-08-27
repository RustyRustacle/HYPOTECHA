type SectionBackgroundProps = {
  kind: 'video' | 'image'
  src: string
  opacity?: number
  overlay?: string
  className?: string
  poster?: string
}

export function SectionBackground({ kind, src, opacity = 100, overlay, className = '', poster }: SectionBackgroundProps) {
  return (
    <div aria-hidden className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {kind === 'video' ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={poster}
          className="h-full w-full object-cover"
          style={{ opacity: opacity / 100 }}
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          style={{ opacity: opacity / 100 }}
        />
      )}
      {overlay && <div className="absolute inset-0" style={{ background: overlay }} />}
    </div>
  )
}
