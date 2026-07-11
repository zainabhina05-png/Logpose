import { NextResponse } from "next/server";
import { execute } from "@/lib/snowflake";
import {
  hashPassword,
  signSession,
  sessionCookieOptions,
} from "@/lib/auth";
import { SignupSchema } from "@/lib/validation";
import { dbError, validationError } from "@/lib/api-utils";

interface UserRow {
  USER_ID: string;
  EMAIL: string;
  DISPLAY_NAME: string;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { email, password, displayName } = parsed.data;

  try {
    const existing = await execute<{ USER_ID: string }>(
      "SELECT user_id FROM users WHERE email = ?",
      [email.toLowerCase()]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", fields: { email: "Email already registered" } },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    await execute(
      `INSERT INTO users (email, password_hash, display_name, is_guest)
       VALUES (?, ?, ?, FALSE)`,
      [email.toLowerCase(), passwordHash, displayName]
    );

    const rows = await execute<UserRow>(
      "SELECT user_id, email, display_name FROM users WHERE email = ?",
      [email.toLowerCase()]
    );
    const user = rows[0];
    if (!user) return dbError();

    const token = await signSession({ userId: user.USER_ID, isGuest: false });
    const response = NextResponse.json(
      {
        user: {
          id: user.USER_ID,
          email: user.EMAIL,
          displayName: user.DISPLAY_NAME,
        },
      },
      { status: 201 }
    );
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (err) {
    console.error("[signup]", err);
    return dbError();
  }
}
