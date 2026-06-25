/** Official Horizon Blue Cross Blue Shield of New Jersey logo (from horizonblue.com press assets) */
const LOGO_SRC = `${import.meta.env.BASE_URL}horizon-healthcare-logo.png`

export function HorizonHealthcareLogo({ className = '', onDark = true }) {
  return (
    <div
      className={`inline-flex items-center ${onDark ? 'rounded-xl bg-white px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.35)]' : ''} ${className}`}
    >
      <img
        src={LOGO_SRC}
        alt="Horizon Blue Cross Blue Shield of New Jersey"
        className="h-8 sm:h-9 w-auto max-w-[min(100%,320px)] object-contain"
        width={462}
        height={101}
      />
    </div>
  )
}
