import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import EntryScorecard from "@/components/entry/EntryScorecard";
import { computeRoundScore } from "@/lib/scoring";
import Link from "next/link";

export const revalidate = 30;

export default async function EntryPage({
  params,
}: {
  params: Promise<{ poolId: string; entryId: string }>;
}) {
  const { poolId, entryId } = await params;
  const supabase = await createClient();

  const [{ data: entry }, { data: rounds }, { data: allScores }] =
    await Promise.all([
      supabase
        .from("entries")
        .select(
          "*, entry_picks(pick_slot, player_id, players(id, full_name, photo_url, country, world_ranking))"
        )
        .eq("id", entryId)
        .eq("pool_id", poolId)
        .single(),
      supabase.from("rounds").select("*").order("id"),
      supabase.from("scores").select("*"),
    ]);

  if (!entry) notFound();

  const picks = (entry.entry_picks ?? []).sort(
    (a: { pick_slot: number }, b: { pick_slot: number }) => a.pick_slot - b.pick_slot
  );

  const completedRounds = (rounds ?? []).filter((r) => r.is_complete);

  // Build per-round results
  const roundResults = completedRounds.map((round) => {
    const playerScores = picks.map((ep: { player_id: string; players: { id: string; full_name: string } | null }) => {
      const score = allScores?.find(
        (s) => s.player_id === ep.player_id && s.round_id === round.id
      );
      return {
        player_id: ep.player_id,
        full_name: ep.players?.full_name ?? "Unknown",
        to_par: score?.to_par ?? null,
      };
    });

    const result = computeRoundScore(playerScores);
    result.round_id = round.id;
    return { ...result, round_label: round.label };
  });

  const totalToPar = roundResults.reduce(
    (sum, r) => sum + (r.round_total ?? 0),
    0
  );

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/pool/${poolId}`}
          className="text-sm text-masters-green hover:underline"
        >
          ← Leaderboard
        </Link>
      </div>

      <EntryScorecard
        entry={entry}
        picks={picks}
        roundResults={roundResults}
        rounds={rounds ?? []}
        totalToPar={totalToPar}
      />
    </div>
  );
}
