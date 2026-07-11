import { NextResponse } from "next/server";
import { execute } from "@/lib/snowflake";
import { signSession, sessionCookieOptions } from "@/lib/auth";
import { dbError } from "@/lib/api-utils";
import { randomUUID } from "crypto";

interface UserRow {
  USER_ID: string;
  EMAIL: string;
  DISPLAY_NAME: string;
}

export async function POST() {
  try {
    const guestId = randomUUID();
    const email = `guest_${guestId}@logpose.local`;
    const displayName = "Guest Captain";

    await execute(
      `INSERT INTO users (email, display_name, is_guest)
       VALUES (?, ?, TRUE)`,
      [email, displayName]
    );

    const rows = await execute<UserRow>(
      "SELECT user_id, email, display_name FROM users WHERE email = ?",
      [email]
    );
    const user = rows[0];
    if (!user) return dbError();

    const token = await signSession({ userId: user.USER_ID, isGuest: true });
    const response = NextResponse.json({
      user: {
        id: user.USER_ID,
        email: user.EMAIL,
        displayName: user.DISPLAY_NAME,
      },
    });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (err) {
    console.error("[guest]", err);
    return dbError();
  }
}
