import { NextResponse } from "next/server";
import { execute } from "@/lib/snowflake";
import { getSessionFromCookies } from "@/lib/auth";
import { IslandSchema } from "@/lib/validation";
import { dbError, unauthorized, validationError } from "@/lib/api-utils";
import type { Island } from "@/lib/types";

interface IslandRow {
  ISLAND_ID: string;
  USER_ID: string;
  NAME: string;
  COLOR_HEX: string;
  ICON: string;
  ARCHIVED: boolean;
  CREATED_AT: string;
}

function mapIsland(row: IslandRow): Island {
  return {
    islandId: row.ISLAND_ID,
    userId: row.USER_ID,
    name: row.NAME,
    colorHex: row.COLOR_HEX,
    icon: row.ICON,
    archived: row.ARCHIVED,
    createdAt: row.CREATED_AT,
  };
}

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) return unauthorized();

  try {
    const rows = await execute<IslandRow>(
      `SELECT island_id, user_id, name, color_hex, icon, archived, created_at
       FROM islands WHERE user_id = ? AND archived = FALSE
       ORDER BY created_at ASC`,
      [session.userId]
    );
    return NextResponse.json({ islands: rows.map(mapIsland) });
  } catch (err) {
    console.error("[islands GET]", err);
    return dbError();
  }
}

export async function POST(request: Request) {
  const session = await getSessionFromCookies();
  if (!session) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = IslandSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { name, colorHex, icon } = parsed.data;

  try {
    await execute(
      `INSERT INTO islands (user_id, name, color_hex, icon)
       VALUES (?, ?, ?, ?)`,
      [session.userId, name, colorHex, icon]
    );

    const rows = await execute<IslandRow>(
      `SELECT island_id, user_id, name, color_hex, icon, archived, created_at
       FROM islands WHERE user_id = ? AND name = ?
       ORDER BY created_at DESC LIMIT 1`,
      [session.userId, name]
    );
    const island = rows[0];
    if (!island) return dbError();

    return NextResponse.json({ island: mapIsland(island) }, { status: 201 });
  } catch (err) {
    console.error("[islands POST]", err);
    return dbError();
  }
}
