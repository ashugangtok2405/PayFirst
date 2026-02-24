import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
     <div className={cn("flex items-center gap-2", className)}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
      >
        <path
          d="M12 2L2 7L12 12L22 7L12 2Z"
          className="stroke-primary"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 17L12 22L22 17"
          className="stroke-primary"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 12L12 17L22 12"
          className="stroke-primary"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
       <span className="font-bold text-xl text-foreground">PayFirst</span>
    </div>
  );
}
