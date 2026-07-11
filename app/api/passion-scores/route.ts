import { NextResponse } from "next/server";
import { execute } from "@/lib/snowflake";
import { getSessionFromCookies } from "@/lib/auth";
import { PASSION_SCORE_SQL } from "@/lib/passionScore";
import { dbError, unauthorized } from "@/lib/api-utils";
import type { PassionScore } from "@/lib/types";

interface ScoreRow {
  ISLAND_ID: string;
  PASSION_SCORE: number;
  MOST_RECENT_HOURS_AGO: number;
}

const cache = new Map<string, { data: PassionScore[]; expires: number }>();
const CACHE_TTL_MS = 30_000;

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) return unauthorized();

  const cached = cache.get(session.userId);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json({ scores: cached.data });
  }

  try {
    const rows = await execute<ScoreRow>(PASSION_SCORE_SQL, [session.userId]);
    const scores: PassionScore[] = rows.map((r) => ({
      islandId: r.ISLAND_ID,
      passionScore: Number(r.PASSION_SCORE),
      mostRecentHoursAgo: Number(r.MOST_RECENT_HOURS_AGO),
    }));

    cache.set(session.userId, {
      data: scores,
      expires: Date.now() + CACHE_TTL_MS,
    });

    return NextResponse.json({ scores });
  } catch (err) {
    console.error("[passion-scores]", err);
    return dbError();
  }
}

export function invalidatePassionCache(userId: string) {
  cache.delete(userId);
}
