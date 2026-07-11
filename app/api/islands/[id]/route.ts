import { NextResponse } from "next/server";
import { execute } from "@/lib/snowflake";
import { getSessionFromCookies } from "@/lib/auth";
import { IslandUpdateSchema } from "@/lib/validation";
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromCookies();
  if (!session) return unauthorized();

  const { id } = await params;

  try {
    const rows = await execute<IslandRow>(
      `SELECT island_id, user_id, name, color_hex, icon, archived, created_at
       FROM islands WHERE island_id = ? AND user_id = ? AND archived = FALSE`,
      [id, session.userId]
    );
    const island = rows[0];
    if (!island) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ island: mapIsland(island) });
  } catch (err) {
    console.error("[islands GET by id]", err);
    return dbError();
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromCookies();
  if (!session) return unauthorized();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = IslandUpdateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const updates = parsed.data;
  const sets: string[] = [];
  const binds: (string | boolean)[] = [];

  if (updates.name !== undefined) {
    sets.push("name = ?");
    binds.push(updates.name);
  }
  if (updates.colorHex !== undefined) {
    sets.push("color_hex = ?");
    binds.push(updates.colorHex);
  }
  if (updates.icon !== undefined) {
    sets.push("icon = ?");
    binds.push(updates.icon);
  }
  if (updates.archived !== undefined) {
    sets.push("archived = ?");
    binds.push(updates.archived);
  }

  if (sets.length === 0) {
    return NextResponse.json(
      { error: "Validation failed", fields: { _root: "No fields to update" } },
      { status: 400 }
    );
  }

  binds.push(id, session.userId);

  try {
    await execute(
      `UPDATE islands SET ${sets.join(", ")} WHERE island_id = ? AND user_id = ?`,
      binds
    );

    const rows = await execute<IslandRow>(
      `SELECT island_id, user_id, name, color_hex, icon, archived, created_at
       FROM islands WHERE island_id = ? AND user_id = ?`,
      [id, session.userId]
    );
    const island = rows[0];
    if (!island) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ island: mapIsland(island) });
  } catch (err) {
    console.error("[islands PATCH]", err);
    return dbError();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromCookies();
  if (!session) return unauthorized();

  const { id } = await params;

  try {
    await execute(
      "UPDATE islands SET archived = TRUE WHERE island_id = ? AND user_id = ?",
      [id, session.userId]
    );
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[islands DELETE]", err);
    return dbError();
  }
}
