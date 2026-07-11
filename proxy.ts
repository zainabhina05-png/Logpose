import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { COOKIE_NAME } from "@/lib/auth";
import type { SessionPayload } from "@/lib/types";

const protectedPagePrefixes = ["/dashboard"];
const protectedApiPrefixes = [
  "/api/islands",
  "/api/entries",
  "/api/passion-scores",
  "/api/demo-seed",
];

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) return new Uint8Array();
  return new TextEncoder().encode(secret);
}

async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = payload.userId as string;
    if (!userId) return null;
    return { userId, isGuest: Boolean(payload.isGuest) };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  const isProtectedPage = protectedPagePrefixes.some((p) =>
    pathname.startsWith(p)
  );
  const isProtectedApi = protectedApiPrefixes.some((p) =>
    pathname.startsWith(p)
  );

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  if (!token) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const session = await verifyToken(token);
  if (!session) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/islands/:path*",
    "/api/entries/:path*",
    "/api/passion-scores/:path*",
    "/api/demo-seed/:path*",
  ],
};
