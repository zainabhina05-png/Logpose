"use client";

import Link from "next/link";
import type { Island, PassionScore } from "@/lib/types";
import { normalizeIcon } from "@/lib/compass-utils";

interface IslandCardProps {
  island: Island;
  score?: PassionScore;
  isLeading?: boolean;
  onQuickLog?: (islandId: string) => void;
}

export function IslandCard({ island, score, isLeading, onQuickLog }: IslandCardProps) {
  const neglect = score ? Math.min(score.mostRecentHoursAgo / 72, 1) : 1;
  const passionPct = score ? Math.min(score.passionScore / 10, 1) : 0;

  const timeAgo = score
    ? score.mostRecentHoursAgo < 1
      ? "just now"
      : score.mostRecentHoursAgo < 24
      ? `${Math.round(score.mostRecentHoursAgo)}h ago`
      : `${Math.round(score.mostRecentHoursAgo / 24)}d ago`
    : null;

  // SVG ring params
  const r = 10;
  const circ = 2 * Math.PI * r;
  const dash = circ * passionPct;

  return (
    <div
      className={`group relative rounded-xl border transition-all ${
        isLeading
          ? "border-ember/50 bg-ember/5"
          : "border-parchment/10 hover:border-parchment/25 hover:bg-parchment/5"
      }`}
    >
      <Link
        href={`/dashboard/islands/${island.islandId}`}
        className="block p-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass rounded-xl"
      >
        <div className="flex items-center gap-3">
          {/* Score ring + dot */}
          <div className="relative shrink-0">
            <svg width="26" height="26" viewBox="0 0 26 26">
              {/* Track ring */}
              <circle
                cx="13" cy="13" r={r}
                fill="none"
                stroke={isLeading ? "rgba(255,107,74,0.2)" : "rgba(237,227,208,0.1)"}
                strokeWidth="2.5"
              />
              {/* Progress ring */}
              {passionPct > 0 && (
                <circle
                  cx="13" cy="13" r={r}
                  fill="none"
                  stroke={isLeading ? "#FF6B4A" : island.colorHex}
                  strokeWidth="2.5"
                  strokeDasharray={`${dash} ${circ}`}
                  strokeLinecap="round"
                  transform="rotate(-90 13 13)"
                  opacity={1 - neglect * 0.4}
                />
              )}
              {/* Center dot */}
              <circle
                cx="13" cy="13" r="4"
                fill={isLeading ? "#FF6B4A" : island.colorHex}
                opacity={1 - neglect * 0.5}
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {island.icon && (
                <span className="text-sm leading-none">{normalizeIcon(island.icon)}</span>
              )}
              <h3 className="font-display text-base truncate">{island.name}</h3>
              {isLeading && (
                <span className="shrink-0 text-ember text-[10px] font-mono uppercase tracking-wider">
                  ◆
                </span>
              )}
            </div>
            {score ? (
              <p className="font-mono text-[11px] text-parchment/50 mt-0.5">
                {score.passionScore.toFixed(1)} pts · {timeAgo}
              </p>
            ) : (
              <p className="font-mono text-[11px] text-parchment/30 mt-0.5">
                No entries yet
              </p>
            )}
          </div>
        </div>
      </Link>

      {/* Quick Log button — appears on hover */}
      {onQuickLog && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickLog(island.islandId);
          }}
          title={`Log session for ${island.name}`}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-brass/90 hover:bg-brass text-ocean text-xs font-bold px-2.5 py-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
        >
          Log
        </button>
      )}
    </div>
  );
}
