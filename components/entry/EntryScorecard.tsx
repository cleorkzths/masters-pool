import PlayerAvatar from "@/components/shared/PlayerAvatar";
import ToParBadge from "@/components/shared/ToParBadge";
import { cn } from "@/lib/utils";
import type { Round } from "@/lib/types";

interface EntryRoundResult {
  round_id: number;
  round_label: string;
  round_total: number | null;
  player_details: {
    player_id: string;
    full_name: string;
    to_par: number | null;
    is_dropped: boolean;
    is_fill_in: boolean;
  }[];
}

interface EntryScorecardProps {
  entry: {
    display_name: string;
  };
  picks: Array<{
    pick_slot: number;
    player_id: string;
    players: {
      id: string;
      full_name: string;
      photo_url: string | null;
      country: string;
      world_ranking: number | null;
    } | null;
  }>;
  roundResults: EntryRoundResult[];
  rounds: Round[];
  totalToPar: number;
}

export default function EntryScorecard({
  entry,
  picks,
  roundResults,
  rounds,
  totalToPar,
}: EntryScorecardProps) {
  const completedRounds = rounds.filter((r) => r.is_complete);

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{entry.display_name}</h1>
            <p className="text-gray-500 text-sm mt-1">Team of 6 · Best 4 scores per round</p>
          </div>
          {completedRounds.length > 0 && (
            <div className="text-right">
              <div className="text-xs text-gray-400 mb-1">Total</div>
              <ToParBadge toPar={totalToPar} large />
            </div>
          )}
        </div>

        {/* Round totals row */}
        {completedRounds.length > 0 && (
          <div className="mt-4 flex gap-4">
            {completedRounds.map((round) => {
              const result = roundResults.find((r) => r.round_id === round.id);
              return (
                <div key={round.id} className="text-center">
                  <div className="text-xs text-gray-400">R{round.id}</div>
                  <ToParBadge toPar={result?.round_total ?? null} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Picks table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700 text-sm">Your Team</h2>
        </div>

        {/* Column headers */}
        <div
          className={cn(
            "grid px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100",
            completedRounds.length > 0
              ? `grid-cols-[2rem_1fr_repeat(${completedRounds.length},3.5rem)_4rem]`
              : "grid-cols-[2rem_1fr_4rem]"
          )}
        >
          <div>#</div>
          <div>Player</div>
          {completedRounds.map((r) => (
            <div key={r.id} className="text-right">R{r.id}</div>
          ))}
          <div className="text-right">Total</div>
        </div>

        {picks.map((pick, idx) => {
          const player = pick.players;
          if (!player) return null;

          // Get this player's score per round
          const playerTotals = completedRounds.map((round) => {
            const result = roundResults.find((r) => r.round_id === round.id);
            return result?.player_details.find(
              (pd) => pd.player_id === pick.player_id
            );
          });

          const totalToPar = playerTotals.reduce(
            (sum, pd) => sum + (pd?.to_par ?? 0),
            0
          );
          const hasAnyScore = playerTotals.some((pd) => pd?.to_par !== null);

          return (
            <div
              key={pick.player_id}
              className={cn(
                "grid px-4 py-3 border-b border-gray-50 items-center",
                completedRounds.length > 0
                  ? `grid-cols-[2rem_1fr_repeat(${completedRounds.length},3.5rem)_4rem]`
                  : "grid-cols-[2rem_1fr_4rem]",
                idx % 2 === 1 && "bg-gray-50/50"
              )}
            >
              <div className="text-sm text-gray-400">{idx + 1}</div>

              <div className="flex items-center gap-2.5 min-w-0">
                <PlayerAvatar
                  name={player.full_name}
                  photoUrl={player.photo_url}
                  size={36}
                />
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate">
                    {player.full_name}
                  </div>
                  <div className="text-xs text-gray-400">{player.country}</div>
                </div>
              </div>

              {/* Per-round scores */}
              {playerTotals.map((pd, rIdx) => (
                <div key={rIdx} className="text-right">
                  {pd ? (
                    <span
                      className={cn(
                        "text-sm font-mono",
                        pd.is_dropped && "line-through opacity-40",
                        !pd.is_dropped && pd.is_fill_in && "text-amber-500",
                        !pd.is_dropped && !pd.is_fill_in && pd.to_par !== null && pd.to_par < 0 && "text-red-600",
                        !pd.is_dropped && !pd.is_fill_in && pd.to_par !== null && pd.to_par > 0 && "text-gray-500"
                      )}
                      title={pd.is_fill_in ? "Fill-in score (+10) — player missed cut or WD" : pd.is_dropped ? "Score dropped (not in best 4)" : "Score counted"}
                    >
                      {pd.is_fill_in ? "+10*" : pd.to_par === 0 ? "E" : pd.to_par! > 0 ? `+${pd.to_par}` : `${pd.to_par}`}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-sm">—</span>
                  )}
                </div>
              ))}

              {/* Player total */}
              <div className="text-right">
                {hasAnyScore ? (
                  <ToParBadge toPar={totalToPar} />
                ) : (
                  <span className="text-gray-300 text-sm">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Strikethrough scores are dropped — only the best 4 per round count toward your total.
        {" "}<span className="text-amber-400">+10*</span> = fill-in score for a missed cut or WD.
      </p>
    </div>
  );
}
