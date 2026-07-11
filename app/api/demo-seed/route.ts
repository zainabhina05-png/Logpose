import { NextResponse } from "next/server";
import { execute } from "@/lib/snowflake";
import { getSessionFromCookies } from "@/lib/auth";
import { dbError, unauthorized } from "@/lib/api-utils";

const DEMO_ISLANDS = [
  { name: "Side Project", colorHex: "#C9973B", icon: "💻" },
  { name: "Watercolor", colorHex: "#FF6B4A", icon: "🎨" },
  { name: "Morning Runs", colorHex: "#5C9EA0", icon: "🏃" },
  { name: "Rust Learning", colorHex: "#8B7355", icon: "📚" },
];

const DEMO_ENTRIES = [
  { islandIdx: 0, minutes: 120, mood: 5, note: "Shipped a feature I'm genuinely proud of!", hoursAgo: 2 },
  { islandIdx: 0, minutes: 90, mood: 4, note: "Good debugging session", hoursAgo: 8 },
  { islandIdx: 0, minutes: 60, mood: 3, note: null, hoursAgo: 24 },
  { islandIdx: 0, minutes: 45, mood: 4, note: "Refactored the auth module", hoursAgo: 48 },
  { islandIdx: 0, minutes: 30, mood: 3, note: null, hoursAgo: 96 },
  { islandIdx: 1, minutes: 90, mood: 5, note: "Painted a sunset I'm in love with!", hoursAgo: 6 },
  { islandIdx: 1, minutes: 60, mood: 4, note: "Practiced wet-on-wet technique", hoursAgo: 30 },
  { islandIdx: 1, minutes: 45, mood: 3, note: null, hoursAgo: 72 },
  { islandIdx: 1, minutes: 30, mood: 4, note: "Sketched some ideas", hoursAgo: 120 },
  { islandIdx: 1, minutes: 20, mood: 2, note: null, hoursAgo: 168 },
  { islandIdx: 2, minutes: 45, mood: 4, note: "Great 5k this morning", hoursAgo: 12 },
  { islandIdx: 2, minutes: 30, mood: 3, note: null, hoursAgo: 36 },
  { islandIdx: 2, minutes: 40, mood: 5, note: "Personal best!", hoursAgo: 60 },
  { islandIdx: 2, minutes: 25, mood: 3, note: null, hoursAgo: 108 },
  { islandIdx: 2, minutes: 20, mood: 2, note: null, hoursAgo: 200 },
  { islandIdx: 3, minutes: 180, mood: 5, note: "Finally understood ownership and borrowing!", hoursAgo: 4 },
  { islandIdx: 3, minutes: 120, mood: 4, note: "Built a CLI tool", hoursAgo: 20 },
  { islandIdx: 3, minutes: 90, mood: 4, note: "Worked through chapter 8", hoursAgo: 44 },
  { islandIdx: 3, minutes: 60, mood: 3, note: null, hoursAgo: 80 },
  { islandIdx: 3, minutes: 45, mood: 3, note: "Struggled with lifetimes", hoursAgo: 140 },
  { islandIdx: 0, minutes: 75, mood: 5, note: "Late night flow state coding session", hoursAgo: 14 },
  { islandIdx: 1, minutes: 50, mood: 4, note: null, hoursAgo: 18 },
  { islandIdx: 2, minutes: 35, mood: 3, note: null, hoursAgo: 52 },
  { islandIdx: 3, minutes: 100, mood: 5, note: "This language is incredible once it clicks", hoursAgo: 10 },
  { islandIdx: 0, minutes: 40, mood: 4, note: null, hoursAgo: 36 },
];

export async function POST() {
  const session = await getSessionFromCookies();
  if (!session) return unauthorized();

  try {
    const existing = await execute<{ CNT: number }>(
      "SELECT COUNT(*) AS cnt FROM entries WHERE user_id = ?",
      [session.userId]
    );
    if ((existing[0]?.CNT ?? 0) > 0) {
      return NextResponse.json({ seeded: false, reason: "already_has_entries" });
    }

    const islandIds: string[] = [];
    for (const island of DEMO_ISLANDS) {
      await execute(
        `INSERT INTO islands (user_id, name, color_hex, icon) VALUES (?, ?, ?, ?)`,
        [session.userId, island.name, island.colorHex, island.icon]
      );
      const rows = await execute<{ ISLAND_ID: string }>(
        `SELECT island_id FROM islands WHERE user_id = ? AND name = ? ORDER BY created_at DESC LIMIT 1`,
        [session.userId, island.name]
      );
      if (rows[0]) islandIds.push(rows[0].ISLAND_ID);
    }

    for (const entry of DEMO_ENTRIES) {
      const islandId = islandIds[entry.islandIdx];
      if (!islandId) continue;

      let sentimentScore = 0;

      await execute(
        `INSERT INTO entries (island_id, user_id, minutes_spent, mood_score, note, sentiment_score, logged_at)
         VALUES (?, ?, ?, ?, ?, ?, DATEADD('hour', ?, CURRENT_TIMESTAMP()))`,
        [
          islandId,
          session.userId,
          entry.minutes,
          entry.mood,
          entry.note,
          sentimentScore,
          -entry.hoursAgo,
        ]
      );
    }

    return NextResponse.json({ seeded: true });
  } catch (err) {
    console.error("[demo-seed]", err);
    return dbError();
  }
}
