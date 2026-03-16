import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import { buildLeaderboard } from "@/lib/scoring";
import Link from "next/link";
import { isDeadlinePassed } from "@/lib/utils";
import { cookies } from "next/headers";

export const revalidate = 30;

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ poolId: string }>;
}) {
  const { poolId } = await params;
  const supabase = await createClient();

  const { data: pool } = await supabase
    .from("pools")
    .select("*")
    .eq("id", poolId)
    .single();

  if (!pool) notFound();

  const [{ data: entries }, { data: rounds }, { data: allScores }] =
    await Promise.all([
      supabase
        .from("entries")
        .select("*, entry_picks(player_id, players(id, full_name))")
        .eq("pool_id", poolId),
      supabase.from("rounds").select("*").order("id"),
      supabase.from("scores").select("*"),
    ]);

  const completedRounds = (rounds ?? [])
    .filter((r) => r.is_complete)
    .map((r) => r.id);

  const scoresMap = new Map<string, Map<number, number | null>>();
  for (const score of allScores ?? []) {
    if (!scoresMap.has(score.player_id)) scoresMap.set(score.player_id, new Map());
    scoresMap.get(score.player_id)!.set(score.round_id, score.to_par);
  }

  const enrichedEntries = (entries ?? []).map((entry) => ({
    ...entry,
    picks: (entry.entry_picks ?? []).map((ep: { player_id: string; players: { full_name: string } | null }) => ({
      player_id: ep.player_id,
      full_name: ep.players?.full_name ?? "Unknown",
    })),
  }));

  const leaderboard = buildLeaderboard(
    enrichedEntries,
    scoresMap,
    completedRounds,
    pool.scoring_keep
  );

  // Check if this browser has an entry via cookie
  const cookieStore = await cookies();
  const myToken = cookieStore.get(`entry_token_${poolId}`)?.value;
  const myEntry = myToken
    ? entries?.find((e) => e.token === myToken)
    : null;

  const deadlinePassed = isDeadlinePassed(pool.pick_deadline);

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{pool.name}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {completedRounds.length === 0
              ? "Tournament hasn't started yet"
              : completedRounds.length === 4
              ? "Tournament complete"
              : `After Round ${completedRounds.length}`}
            {" · "}{leaderboard.length} {leaderboard.length === 1 ? "entry" : "entries"}
          </p>
        </div>

        <div className="flex gap-3">
          {myEntry && (
            <Link
              href={`/pool/${poolId}/entry/${myEntry.id}`}
              className="px-5 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors text-sm"
            >
              My Team
            </Link>
          )}
          {!deadlinePassed && (
            <Link
              href={`/pool/${poolId}/pick`}
              className="px-5 py-2 bg-masters-green text-white font-semibold rounded-lg hover:bg-green-800 transition-colors text-sm"
            >
              {myEntry ? "Edit My Picks" : "Make My Picks"}
            </Link>
          )}
        </div>
      </div>

      {/* Round indicators */}
      {rounds && rounds.length > 0 && (
        <div className="flex gap-2 mb-6">
          {rounds.map((round) => (
            <div
              key={round.id}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                round.is_complete
                  ? "bg-masters-green text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              R{round.id} {round.is_complete ? "✓" : ""}
            </div>
          ))}
        </div>
      )}

      <LeaderboardTable
        leaderboard={leaderboard}
        poolId={poolId}
        myEntryId={myEntry?.id}
        completedRounds={completedRounds}
      />

      {leaderboard.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">⛳</div>
          <p className="text-lg">No entries yet.</p>
          {!deadlinePassed && (
            <p className="text-sm mt-2">
              Be the first to{" "}
              <Link href={`/pool/${poolId}/pick`} className="text-masters-green underline">
                make your picks
              </Link>
              !
            </p>
          )}
        </div>
      )}
    </div>
  );
}
