"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Island, PassionScore } from "@/lib/types";
import { CompassFallback } from "./CompassFallback";
import { CompassSceneFallback } from "./CompassScene";

const CompassScene = dynamic(
  () => import("./CompassScene").then((m) => m.CompassScene),
  { ssr: false, loading: () => <CompassSceneFallback /> }
);

interface CompassViewProps {
  islands: Island[];
  scores: PassionScore[];
  focusedIslandId?: string;
  onIslandClick?: (id: string) => void;
  onNavigate?: (id: string) => void;
}

export function CompassView({ islands, scores, focusedIslandId, onIslandClick, onNavigate }: CompassViewProps) {
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      setWebgl(!!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
    } catch {
      setWebgl(false);
    }
  }, []);

  if (webgl === null) return <CompassSceneFallback />;

  if (!webgl) {
    return (
      <CompassFallback
        islands={islands}
        scores={scores}
        onIslandClick={onIslandClick}
      />
    );
  }

  return (
    <CompassScene
      islands={islands}
      scores={scores}
      focusedIslandId={focusedIslandId}
      onIslandClick={onIslandClick}
      onNavigate={onNavigate}
    />
  );
}
