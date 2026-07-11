"use client";

import type { Island, PassionScore } from "@/lib/types";
import { useCompassData, computeIslandAngle } from "@/lib/compass-utils";

interface CompassFallbackProps {
  islands: Island[];
  scores: PassionScore[];
  onIslandClick?: (id: string) => void;
}

export function CompassFallback({
  islands,
  scores,
  onIslandClick,
}: CompassFallbackProps) {
  const { normalized, needleAngle, leadingId } = useCompassData(islands, scores);
  const scoreMap = new Map(scores.map((s) => [s.islandId, s]));

  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      <svg viewBox="0 0 200 200" className="h-full w-full" aria-label="Compass view">
        {/* Ocean background circle */}
        <circle cx="100" cy="100" r="95" fill="#0B2027" stroke="#C9973B" strokeWidth="3" />
        <circle cx="100" cy="100" r="85" fill="none" stroke="#C9973B" strokeWidth="1" opacity="0.5" />

        {/* Island markers */}
        {islands.map((island, i) => {
          const angleDeg = computeIslandAngle(i, islands.length) - 90;
          const angleRad = (angleDeg * Math.PI) / 180;
          const r = 70;
          const cx = 100 + Math.cos(angleRad) * r;
          const cy = 100 + Math.sin(angleRad) * r;
          const isLeading = island.islandId === leadingId;
          const norm = normalized.get(island.islandId) ?? 0;
          const hours = scoreMap.get(island.islandId)?.mostRecentHoursAgo ?? 999;
          const neglect = Math.min(hours / 72, 1);
          const fill = isLeading ? "#FF6B4A" : neglect > 0.5 ? "#5C6B70" : island.colorHex;
          const opacity = 1 - neglect * 0.4;
          const size = 6 + norm * 8;

          return (
            <g key={island.islandId}>
              <circle
                cx={cx}
                cy={cy}
                r={size}
                fill={fill}
                opacity={opacity}
                className="cursor-pointer"
                onClick={() => onIslandClick?.(island.islandId)}
                role="button"
                aria-label={island.name}
              />
              <text
                x={cx}
                y={cy + size + 12}
                textAnchor="middle"
                fill="#EDE3D0"
                fontSize="8"
                fontFamily="var(--font-display)"
              >
                {island.name}
              </text>
            </g>
          );
        })}

        {/* Needle */}
        <g transform={`rotate(${needleAngle} 100 100)`}>
          <polygon points="100,35 95,100 100,90 105,100" fill="#FF6B4A" />
          <polygon points="100,165 95,100 100,110 105,100" fill="#C9973B" />
          <circle cx="100" cy="100" r="5" fill="#8B6914" />
        </g>
      </svg>
    </div>
  );
}

export function useWebGLAvailable(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}
