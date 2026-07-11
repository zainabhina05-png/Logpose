import { execute } from "@/lib/snowflake";

export async function computeSentiment(note?: string | null): Promise<number> {
  const trimmed = note?.trim();
  if (!trimmed) return 0;

  try {
    const rows = await execute<{ SCORE: number }>(
      "SELECT SNOWFLAKE.CORTEX.SENTIMENT(?) AS score",
      [trimmed]
    );
    const score = rows[0]?.SCORE;
    return score != null ? Number(score) : 0;
  } catch (err) {
    console.error("[cortex sentiment]", err);
    return 0;
  }
}
