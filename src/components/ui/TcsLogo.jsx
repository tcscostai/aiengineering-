const LOGO_SRC = `${import.meta.env.BASE_URL}branding/tcs-logo-white.svg`

const VARIANT_CLASS = {
  compact: 'h-7 w-auto max-w-[36px]',
  default: 'h-9 sm:h-10 w-auto max-w-[min(100%,200px)]',
  hero: 'w-full max-w-[min(100%,360px)] sm:max-w-[min(100%,420px)] xl:max-w-[min(100%,480px)] h-auto',
}

/** Active brand logo — HorizonHealthcareLogo is reserved for later use */
export function TcsLogo({ className = '', compact = false, variant = 'default', alt = 'TCS' }) {
  const sizeKey = compact ? 'compact' : variant
  return (
    <img
      src={LOGO_SRC}
      alt={alt}
      className={`object-contain object-left ${VARIANT_CLASS[sizeKey] ?? VARIANT_CLASS.default} ${className}`}
    />
  )
}
