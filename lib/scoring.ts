import type { EntryRoundResult } from "./types";

const WD_PENALTY = 99;

export function formatToPar(n: number | null): string {
  if (n === null) return "-";
  if (n === 0) return "E";
  return n > 0 ? `+${n}` : `${n}`;
}

export function toParColor(n: number | null): string {
  if (n === null) return "text-gray-400";
  if (n < 0) return "text-red-600";
  if (n === 0) return "text-gray-800";
  return "text-gray-600";
}

/**
 * Given 6 players' to_par scores for one round, returns the best-4 scoring result.
 * null scores (WD/no play) are treated as +99 so they're always dropped.
 */
export function computeRoundScore(
  playerScores: { player_id: string; full_name: string; to_par: number | null }[],
  keepCount = 4
): EntryRoundResult & { round_id: number } {
  const withEffective = playerScores.map((p) => ({
    ...p,
    effective: p.to_par !== null ? p.to_par : WD_PENALTY,
  }));

  // Sort ascending (best scores first)
  const sorted = [...withEffective].sort((a, b) => a.effective - b.effective);

  const kept = sorted.slice(0, keepCount);
  const dropped = sorted.slice(keepCount);

  const keptIds = new Set(kept.map((p) => p.player_id));
  const roundTotal = kept.every((p) => p.to_par !== null)
    ? kept.reduce((sum, p) => sum + p.effective, 0)
    : null;

  return {
    round_id: 0, // caller sets this
    scores_used: kept.map((p) => p.to_par),
    scores_dropped: dropped.map((p) => p.to_par),
    round_total: roundTotal,
    player_details: withEffective.map((p) => ({
      player_id: p.player_id,
      full_name: p.full_name,
      to_par: p.to_par,
      is_dropped: !keptIds.has(p.player_id),
    })),
  };
}

export function computeEntryTotal(roundResults: EntryRoundResult[]): number {
  return roundResults.reduce((sum, r) => sum + (r.round_total ?? 0), 0);
}

export function buildLeaderboard<
  T extends { id: string; display_name: string; pool_id: string; user_id: string }
>(
  entries: Array<T & { picks: Array<{ player_id: string; full_name: string }> }>,
  allScores: Map<string, Map<number, number | null>>, // player_id -> round_id -> to_par
  completedRounds: number[],
  keepCount = 4
) {
  const results = entries.map((entry) => {
    const roundResults = completedRounds.map((roundId) => {
      const playerScores = entry.picks.map((pick) => ({
        player_id: pick.player_id,
        full_name: pick.full_name,
        to_par: allScores.get(pick.player_id)?.get(roundId) ?? null,
      }));
      const result = computeRoundScore(playerScores, keepCount);
      result.round_id = roundId;
      return result;
    });

    return {
      ...entry,
      entry_id: entry.id,
      total_to_par: computeEntryTotal(roundResults),
      rounds_played: completedRounds.length,
      round_results: roundResults,
    };
  });

  results.sort((a, b) => a.total_to_par - b.total_to_par);

  let position = 1;
  return results.map((r, i) => {
    if (i > 0 && r.total_to_par !== results[i - 1].total_to_par) {
      position = i + 1;
    }
    return { ...r, position };
  });
}
