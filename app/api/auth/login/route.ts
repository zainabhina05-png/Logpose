import { NextResponse } from "next/server";
import { execute } from "@/lib/snowflake";
import {
  comparePassword,
  signSession,
  sessionCookieOptions,
} from "@/lib/auth";
import { LoginSchema } from "@/lib/validation";
import { dbError, validationError } from "@/lib/api-utils";

interface UserRow {
  USER_ID: string;
  EMAIL: string;
  DISPLAY_NAME: string;
  PASSWORD_HASH: string;
  IS_GUEST: boolean;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { email, password } = parsed.data;

  try {
    const rows = await execute<UserRow>(
      `SELECT user_id, email, display_name, password_hash, is_guest
       FROM users WHERE email = ?`,
      [email.toLowerCase()]
    );
    const user = rows[0];
    if (!user) {
      return NextResponse.json(
        { error: "Validation failed", fields: { email: "Invalid credentials" } },
        { status: 400 }
      );
    }
    
    if (user.IS_GUEST || !user.PASSWORD_HASH) {
      return NextResponse.json(
        { error: "Validation failed", fields: { email: "This is a guest account. It cannot be logged into with a password." } },
        { status: 400 }
      );
    }

    const valid = await comparePassword(password, user.PASSWORD_HASH);
    if (!valid) {
      return NextResponse.json(
        { error: "Validation failed", fields: { password: "Wrong password" } },
        { status: 400 }
      );
    }

    const token = await signSession({
      userId: user.USER_ID,
      isGuest: user.IS_GUEST,
    });
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
    console.error("[login]", err);
    return dbError();
  }
}
