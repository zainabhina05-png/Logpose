import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/snowflake";
import { getSessionFromCookies } from "@/lib/auth";
import { EntrySchema, EntriesQuerySchema } from "@/lib/validation";
import { dbError, unauthorized, validationError } from "@/lib/api-utils";
import type { Entry } from "@/lib/types";

interface EntryRow {
  ENTRY_ID: string;
  ISLAND_ID: string;
  USER_ID: string;
  MINUTES_SPENT: number;
  MOOD_SCORE: number;
  NOTE: string | null;
  SENTIMENT_SCORE: number | null;
  LOGGED_AT: string;
}

function mapEntry(row: EntryRow): Entry {
  return {
    entryId: row.ENTRY_ID,
    islandId: row.ISLAND_ID,
    userId: row.USER_ID,
    minutesSpent: row.MINUTES_SPENT,
    moodScore: row.MOOD_SCORE,
    note: row.NOTE,
    sentimentScore: row.SENTIMENT_SCORE,
    loggedAt: row.LOGGED_AT,
  };
}



export async function POST(request: Request) {
  const session = await getSessionFromCookies();
  if (!session) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = EntrySchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { islandId, minutesSpent, moodScore, note } = parsed.data;

  try {
    const islands = await execute<{ ISLAND_ID: string }>(
      "SELECT island_id FROM islands WHERE island_id = ? AND user_id = ? AND archived = FALSE",
      [islandId, session.userId]
    );
    if (islands.length === 0) {
      return NextResponse.json(
        { error: "Validation failed", fields: { islandId: "Island not found" } },
        { status: 400 }
      );
    }

    let sentimentScore = 0;

    await execute(
      `INSERT INTO entries (island_id, user_id, minutes_spent, mood_score, note, sentiment_score)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        islandId,
        session.userId,
        minutesSpent,
        moodScore,
        note?.trim() || null,
        sentimentScore,
      ]
    );

    const rows = await execute<EntryRow>(
      `SELECT entry_id, island_id, user_id, minutes_spent, mood_score, note, sentiment_score, logged_at
       FROM entries WHERE user_id = ? AND island_id = ?
       ORDER BY logged_at DESC LIMIT 1`,
      [session.userId, islandId]
    );
    const entry = rows[0];
    if (!entry) return dbError();

    return NextResponse.json({ entry: mapEntry(entry) }, { status: 201 });
  } catch (err) {
    console.error("[entries POST]", err);
    return dbError();
  }
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) return unauthorized();

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = EntriesQuerySchema.safeParse(params);
  if (!parsed.success) return validationError(parsed.error);

  const { islandId, cursor, limit } = parsed.data;

  try {
    let sql = `
      SELECT entry_id, island_id, user_id, minutes_spent, mood_score, note, sentiment_score, logged_at
      FROM entries WHERE user_id = ?`;
    const binds: (string | number)[] = [session.userId];

    if (islandId) {
      sql += " AND island_id = ?";
      binds.push(islandId);
    }
    if (cursor) {
      sql += " AND logged_at < ?";
      binds.push(cursor);
    }
    sql += " ORDER BY logged_at DESC LIMIT ?";
    binds.push(limit + 1);

    const rows = await execute<EntryRow>(sql, binds);
    const hasMore = rows.length > limit;
    const entries = (hasMore ? rows.slice(0, limit) : rows).map(mapEntry);
    const nextCursor = hasMore ? entries[entries.length - 1]?.loggedAt : undefined;

    return NextResponse.json({ entries, nextCursor });
  } catch (err) {
    console.error("[entries GET]", err);
    return dbError();
  }
}
