import { createServiceClient } from "@/lib/supabase/server";
import { buildLeaderboard } from "@/lib/scoring";

export async function POST(req: Request) {
  const { poolId, tournament } = await req.json();
  if (!poolId) return Response.json({ error: "poolId required" }, { status: 400 });

  const supabase = await createServiceClient();

  const [{ data: pool }, { data: entries }, { data: rounds }, { data: scores }] =
    await Promise.all([
      supabase.from("pools").select("*").eq("id", poolId).single(),
      supabase
        .from("entries")
        .select("*, entry_picks(player_id, players(id, full_name))")
        .eq("pool_id", poolId),
      supabase.from("rounds").select("*").order("id"),
      supabase.from("scores").select("*"),
    ]);

  if (!pool) return Response.json({ error: "Pool not found" }, { status: 404 });

  const completedRoundIds = (rounds ?? [])
    .filter((r) => r.is_complete)
    .map((r) => r.id as number);

  const scoresMap = new Map<string, Map<number, number | null>>();
  for (const score of scores ?? []) {
    if (!scoresMap.has(score.player_id)) scoresMap.set(score.player_id, new Map());
    scoresMap.get(score.player_id)!.set(score.round_id, score.to_par);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enrichedEntries = (entries ?? []).map((entry: any) => ({
    ...entry,
    picks: (entry.entry_picks ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ep: any) => ({ player_id: ep.player_id, full_name: ep.players?.full_name ?? "Unknown" })
    ),
  }));

  const leaderboard = buildLeaderboard(
    enrichedEntries,
    scoresMap,
    completedRoundIds,
    pool.scoring_keep
  );

  const results = leaderboard.map((entry) => ({
    position: entry.position,
    display_name: entry.display_name,
    total_to_par: entry.total_to_par,
    round_totals: entry.round_results.map((r: { round_total: number }) => r.round_total),
    picks: entry.picks.map((p: { full_name: string }) => p.full_name),
  }));

  const { error } = await supabase.from("pool_results").insert({
    pool_id: poolId,
    pool_name: pool.name,
    year: pool.year,
    tournament: tournament ?? "Masters",
    results,
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true, entries: results.length });
}
