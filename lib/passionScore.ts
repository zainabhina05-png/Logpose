export const DEFAULT_DECAY_CONSTANT = 0.006;

/** Pure decay weight: halves roughly every ~115 hours at 0.006 (≈5 days). */
export function computeDecayWeight(
  hoursAgo: number,
  decayConstant: number = DEFAULT_DECAY_CONSTANT
): number {
  if (hoursAgo < 0) return 1;
  return Math.exp(-decayConstant * hoursAgo);
}

export const PASSION_SCORE_SQL = `
WITH scored AS (
  SELECT
    island_id,
    minutes_spent,
    mood_score,
    COALESCE(sentiment_score, 0) AS sentiment_score,
    DATEDIFF('hour', logged_at, CURRENT_TIMESTAMP()) AS hours_ago,
    (minutes_spent / 60.0)
      * (1 + mood_score / 5.0)
      * (1 + GREATEST(sentiment_score, 0))
      * EXP(-0.006 * DATEDIFF('hour', logged_at, CURRENT_TIMESTAMP())) AS weighted_score
  FROM entries
  WHERE user_id = ?
)
SELECT island_id, SUM(weighted_score) AS passion_score, MAX(hours_ago) AS most_recent_hours_ago
FROM scored
GROUP BY island_id
ORDER BY passion_score DESC
`;
