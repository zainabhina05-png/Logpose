import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function fieldErrors(error: ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_root";
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

export function validationError(error: ZodError) {
  return NextResponse.json(
    { error: "Validation failed", fields: fieldErrors(error) },
    { status: 400 }
  );
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function dbError() {
  return NextResponse.json(
    { error: "Database temporarily unavailable" },
    { status: 502 }
  );
}
