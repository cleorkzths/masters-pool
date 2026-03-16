import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PlayerAvatar from "@/components/shared/PlayerAvatar";
import ToParBadge from "@/components/shared/ToParBadge";

export const revalidate = 60;

export default async function FieldPage({
  params,
}: {
  params: Promise<{ poolId: string }>;
}) {
  const { poolId } = await params;
  const supabase = await createClient();

  const [{ data: pool }, { data: players }, { data: rounds }, { data: allScores }] =
    await Promise.all([
      supabase.from("pools").select("*").eq("id", poolId).single(),
      supabase
        .from("players")
        .select("*")
        .eq("is_active", true)
        .order("world_ranking", { ascending: true, nullsFirst: false }),
      supabase.from("rounds").select("*").order("id"),
      supabase.from("scores").select("*"),
    ]);

  if (!pool) notFound();

  const completedRounds = (rounds ?? []).filter((r) => r.is_complete);

  // Build score lookup
  const scoreMap = new Map<string, Map<number, number | null>>();
  for (const score of allScores ?? []) {
    if (!scoreMap.has(score.player_id)) scoreMap.set(score.player_id, new Map());
    scoreMap.get(score.player_id)!.set(score.round_id, score.to_par);
  }

  // Calculate total for each player
  const playersWithTotal = (players ?? []).map((player) => {
    const roundScores = completedRounds.map((r) =>
      scoreMap.get(player.id)?.get(r.id) ?? null
    );
    const total = roundScores.some((s) => s !== null)
      ? roundScores.reduce((sum: number, s) => sum + (s ?? 0), 0)
      : null;
    return { ...player, roundScores, total };
  });

  // Sort by total (best first), nulls last
  playersWithTotal.sort((a, b) => {
    if (a.total === null && b.total === null) return 0;
    if (a.total === null) return 1;
    if (b.total === null) return -1;
    return a.total - b.total;
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Field Scores</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div
          className={`grid px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide ${
            completedRounds.length > 0
              ? `grid-cols-[auto_1fr_repeat(${completedRounds.length},3.5rem)_4rem]`
              : "grid-cols-[auto_1fr_4rem]"
          }`}
        >
          <div className="w-10" />
          <div>Player</div>
          {completedRounds.map((r) => (
            <div key={r.id} className="text-right">R{r.id}</div>
          ))}
          <div className="text-right">Total</div>
        </div>

        {playersWithTotal.map((player, idx) => (
          <div
            key={player.id}
            className={`grid items-center px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${
              completedRounds.length > 0
                ? `grid-cols-[auto_1fr_repeat(${completedRounds.length},3.5rem)_4rem]`
                : "grid-cols-[auto_1fr_4rem]"
            } ${idx % 2 === 1 ? "bg-gray-50/30" : ""}`}
          >
            <div className="w-10">
              <PlayerAvatar
                name={player.full_name}
                photoUrl={player.photo_url}
                size={36}
              />
            </div>
            <div>
              <div className="font-medium text-sm text-gray-900">{player.full_name}</div>
              <div className="text-xs text-gray-400">{player.country}</div>
            </div>
            {player.roundScores.map((score: number | null, rIdx: number) => (
              <div key={rIdx} className="text-right">
                <ToParBadge toPar={score} />
              </div>
            ))}
            <div className="text-right">
              <ToParBadge toPar={player.total} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
