"use client";

import { useMemo } from "react";
import type { Island, PassionScore, Entry } from "@/lib/types";

export function computeStreak(entries: Entry[]): number {
  if (entries.length === 0) return 0;
  const days = new Set(
    entries.map((e) => new Date(e.loggedAt).toDateString())
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (days.has(d.toDateString())) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

export function normalizeIcon(icon: string | null | undefined): string {
  if (!icon) return "🏝️";
  const map: Record<string, string> = {
    code: "💻",
    palette: "🎨",
    run: "🏃",
    book: "📚",
  };
  return map[icon] || icon;
}

export function computeIslandAngle(index: number, total: number): number {
  if (total === 0) return 0;
  return (index / total) * 360;
}

export function getLeadingIslandId(
  islands: Island[],
  scores: PassionScore[]
): string | null {
  if (scores.length === 0 || islands.length === 0) return islands[0]?.islandId ?? null;
  const scoreMap = new Map(scores.map((s) => [s.islandId, s.passionScore]));
  let bestId = islands[0].islandId;
  let bestScore = scoreMap.get(bestId) ?? 0;
  for (const island of islands) {
    const score = scoreMap.get(island.islandId) ?? 0;
    if (score > bestScore) {
      bestScore = score;
      bestId = island.islandId;
    }
  }
  return bestId;
}

export function getNeedleAngle(
  islands: Island[],
  scores: PassionScore[]
): number {
  const leadingId = getLeadingIslandId(islands, scores);
  const index = islands.findIndex((i) => i.islandId === leadingId);
  if (index < 0) return 0;
  return computeIslandAngle(index, islands.length);
}

export function normalizeScores(scores: PassionScore[]): Map<string, number> {
  const max = Math.max(...scores.map((s) => s.passionScore), 0.001);
  return new Map(scores.map((s) => [s.islandId, s.passionScore / max]));
}

export function useCompassData(islands: Island[], scores: PassionScore[]) {
  return useMemo(() => {
    const normalized = normalizeScores(scores);
    const needleAngle = getNeedleAngle(islands, scores);
    const leadingId = getLeadingIslandId(islands, scores);
    return { normalized, needleAngle, leadingId };
  }, [islands, scores]);
}
