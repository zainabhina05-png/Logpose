import { NextResponse } from "next/server";
import { execute } from "@/lib/snowflake";

export async function GET() {
  try {
    const rows = await execute<{ "1": number }>("SELECT 1 AS \"1\"");
    return NextResponse.json({ ok: true, result: rows[0]?.["1"] ?? 1 });
  } catch (err) {
    console.error("[health]", err);
    return NextResponse.json(
      { ok: false, error: "Snowflake connection failed" },
      { status: 502 }
    );
  }
}
