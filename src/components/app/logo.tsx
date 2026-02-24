'use client'

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
     <div className={cn("flex items-center justify-center gap-2", className)}>
        <svg width="32" height="36" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 0L35 7.5V22.5C35 32.5 28 39 18 40C8 39 1 32.5 1 22.5V7.5L18 0Z" fill="#22C55E"/>
            <text x="18" y="22" textAnchor="middle" alignmentBaseline="middle" fill="white" fontSize="18" fontWeight="bold">₹</text>
        </svg>
      <span className="font-bold text-2xl text-white">PayFirst</span>
    </div>
  );
}
