'use client'

import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <svg
        width="32"
        height="36"
        viewBox="0 0 32 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logo-gradient" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <path
          d="M16 0L31 6.75V19.6875C31 29.0625 24.5 35.25 16 36C7.5 35.25 1 29.0625 1 19.6875V6.75L16 0Z"
          fill="url(#logo-gradient)"
        />
        <text
          x="16"
          y="20"
          textAnchor="middle"
          alignmentBaseline="middle"
          fill="white"
          fontSize="16"
          fontWeight="bold"
        >
          ₹
        </text>
      </svg>
      <span className="font-bold text-2xl text-foreground">PayFirst</span>
    </div>
  )
}
