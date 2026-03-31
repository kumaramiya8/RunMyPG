'use client'

// Full logo with text — for sidebar header, desktop views
export function LogoFull({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" className={className}>
      <defs>
        <linearGradient id="vibeGradientFull" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#FF6B6B', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <g transform="translate(20, 20)">
        <path d="M 40 5 L 75 40 L 75 75 L 5 75 L 5 40 Z" fill="none" stroke="url(#vibeGradientFull)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 40 25 L 40 75" fill="none" stroke="url(#vibeGradientFull)" strokeWidth="8" strokeLinecap="round" />
        <path d="M 25 40 L 40 25 L 55 40" fill="none" stroke="url(#vibeGradientFull)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <text x="120" y="75" fontFamily="system-ui, -apple-system, sans-serif" fontSize="52" fontWeight="900" fill="#1E293B" letterSpacing="-2">
        RunMy<tspan fill="url(#vibeGradientFull)">PG</tspan>
      </text>
      <text x="122" y="98" fontFamily="system-ui, -apple-system, sans-serif" fontSize="12" fontWeight="600" fill="#64748B" letterSpacing="3">
        MODERN STAY MANAGEMENT
      </text>
    </svg>
  )
}

// Icon only — for mobile header, small spaces
export function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width={size} height={size}>
      <defs>
        <linearGradient id="vibeGradientIcon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#FF6B6B', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <path d="M 40 5 L 75 40 L 75 75 L 5 75 L 5 40 Z" fill="none" stroke="url(#vibeGradientIcon)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 40 25 L 40 75" fill="none" stroke="url(#vibeGradientIcon)" strokeWidth="7" strokeLinecap="round" />
      <path d="M 25 40 L 40 25 L 55 40" fill="none" stroke="url(#vibeGradientIcon)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
