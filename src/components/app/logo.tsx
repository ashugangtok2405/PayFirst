'use client'

import { cn } from '@/lib/utils'
import Image from 'next/image'
import payFirstLogo from '@/images/PayFirstlogo.png'

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Image
        src={payFirstLogo}
        alt="PayFirst Logo"
        width={140}
        height={36}
        priority
      />
    </div>
  )
}
