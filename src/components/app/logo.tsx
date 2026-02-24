import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
     <div className={cn("flex items-center gap-3", className)}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M7.53343 3.33301L19.9998 9.13301L32.4661 3.33301L19.9998 1.66699e-05L7.53343 3.33301Z" fill="#1D4ED8"/>
        <path d="M7.5 7.49967V19.058C7.5 19.883 7.82475 20.6743 8.3975 21.247L18.75 31.6663C19.4455 32.3619 20.5545 32.3619 21.25 31.6663L31.6025 21.247C32.1752 20.6743 32.5 19.883 32.5 19.058V7.49967L20 13.333L7.5 7.49967Z" fill="url(#paint0_linear_10_133)"/>
        <path d="M26.25 15.833L18.3333 23.75L15 20.4167" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <defs>
          <linearGradient id="paint0_linear_10_133" x1="7.5" y1="7.49967" x2="32.5" y2="7.49967" gradientUnits="userSpaceOnUse">
            <stop stopColor="#22C55E"/>
            <stop offset="1" stopColor="#16A34A"/>
          </linearGradient>
        </defs>
      </svg>
      <span className="font-bold text-3xl text-gray-800">PayFirst</span>
    </div>
  );
}
