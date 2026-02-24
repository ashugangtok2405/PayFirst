'use client'

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
     <div className={cn("flex items-center gap-3", className)}>
        <svg width="36" height="40" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 0L35 7.5V22.5C35 32.5 28 39 18 40C8 39 1 32.5 1 22.5V7.5L18 0Z" fill="#22C55E"/>
            <path d="M11.5 14H22.5M11.5 19H24.5M15.5 14V26" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      <span className="font-bold text-3xl text-white">PayFirst</span>
    </div>
  );
}
