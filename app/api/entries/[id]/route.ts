import { NextResponse } from "next/server";
import { execute } from "@/lib/snowflake";
import { getSessionFromCookies } from "@/lib/auth";
import { dbError, unauthorized, validationError } from "@/lib/api-utils";
import { EntrySchema } from "@/lib/validation";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromCookies();
  if (!session) return unauthorized();

  try {
    const { id } = await params;
    
    // First verify the entry belongs to the user
    const existing = await execute<{ ENTRY_ID: string }>(
      "SELECT entry_id FROM entries WHERE entry_id = ? AND user_id = ?",
      [id, session.userId]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Entry not found or unauthorized" },
        { status: 404 }
      );
    }

    await execute("DELETE FROM entries WHERE entry_id = ?", [id]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[entries DELETE]", err);
    return dbError();
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromCookies();
  if (!session) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = EntrySchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { islandId, minutesSpent, moodScore, note } = parsed.data;

  try {
    const { id } = await params;
    
    // First verify the entry belongs to the user
    const existing = await execute<{ ENTRY_ID: string }>(
      "SELECT entry_id FROM entries WHERE entry_id = ? AND user_id = ?",
      [id, session.userId]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Entry not found or unauthorized" },
        { status: 404 }
      );
    }

    await execute(
      "UPDATE entries SET island_id = ?, minutes_spent = ?, mood_score = ?, note = ? WHERE entry_id = ?",
      [islandId, minutesSpent, moodScore, note?.trim() || null, id]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[entries PATCH]", err);
    return dbError();
  }
}
