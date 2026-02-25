'use client'

import { cn } from "@/lib/utils";

interface HealthScoreGaugeProps {
  score: number;
  status: string;
  size?: number;
  strokeWidth?: number;
}

export function HealthScoreGauge({
  score,
  status,
  size = 200,
  strokeWidth = 16,
}: HealthScoreGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const scoreColor =
    score >= 85
      ? "text-green-500"
      : score >= 70
      ? "text-blue-500"
      : score >= 50
      ? "text-yellow-500"
      : score >= 30
      ? "text-orange-500"
      : "text-red-500";
  
  const trackColor =
    score >= 85
      ? "stroke-green-500/20"
      : score >= 70
      ? "stroke-blue-500/20"
      : score >= 50
      ? "stroke-yellow-500/20"
      : score >= 30
      ? "stroke-orange-500/20"
      : "stroke-red-500/20";
    
  const indicatorColor =
    score >= 85
        ? "stroke-green-500"
        : score >= 70
        ? "stroke-blue-500"
        : score >= 50
        ? "stroke-yellow-500"
        : score >= 30
        ? "stroke-orange-500"
        : "stroke-red-500";


  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute top-0 left-0" width={size} height={size}>
        <circle
          className={cn("transition-all", trackColor)}
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={cn("transition-all duration-1000 ease-out", indicatorColor)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
      </svg>
      <div className="text-center">
        <div className={cn("text-5xl font-bold transition-colors", scoreColor)}>
          {Math.round(score)}
        </div>
        <div className={cn("text-lg font-semibold transition-colors", scoreColor)}>
          {status}
        </div>
      </div>
    </div>
  );
}
