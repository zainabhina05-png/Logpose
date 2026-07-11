"use client";

import { useRef } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/Button";
import type { Island, PassionScore } from "@/lib/types";
import { getLeadingIslandId } from "@/lib/compass-utils";

interface ShareCardProps {
  islands: Island[];
  scores: PassionScore[];
}

export function ShareCard({ islands, scores }: ShareCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const leadingId = getLeadingIslandId(islands, scores);
  const leading = islands.find((i) => i.islandId === leadingId);

  const handleExport = async () => {
    if (!ref.current) return;
    try {
      const dataUrl = await toPng(ref.current, { pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = "log-pose-card.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  return (
    <div className="space-y-3">
      <div
        ref={ref}
        className="rounded-xl bg-ocean border border-brass/30 p-6 text-parchment"
      >
        <p className="font-display text-2xl font-bold text-brass mb-1">Log Pose</p>
        <p className="text-sm text-parchment/70 mb-4">Passion Tracker</p>
        {leading ? (
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-ember mb-1">
              Currently burning
            </p>
            <p className="font-display text-3xl text-ember">{leading.name}</p>
            <p className="font-mono text-sm text-parchment/60 mt-2">
              {islands.length} island{islands.length !== 1 ? "s" : ""} charted
            </p>
          </div>
        ) : (
          <p className="text-parchment/60">Chart your course</p>
        )}
      </div>
      <Button variant="secondary" size="sm" onClick={handleExport} className="w-full">
        Export Card
      </Button>
    </div>
  );
}
