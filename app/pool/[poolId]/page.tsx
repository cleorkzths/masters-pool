import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { isDeadlinePassed } from "@/lib/utils";
import { cookies } from "next/headers";
import PoolPageClient from "@/components/leaderboard/PoolPageClient";

export const revalidate = 300;

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

  const [{ data: entries }, { data: rounds }, { data: allScores }, { data: allPlayers }] =
    await Promise.all([
      supabase
        .from("entries")
        .select("*, entry_picks(player_id, players(id, full_name))")
        .eq("pool_id", poolId),
      supabase.from("rounds").select("*").order("id"),
      supabase.from("scores").select("player_id, round_id, to_par"),
      supabase
        .from("players")
        .select("id, full_name, photo_url, country")
        .eq("is_active", true),
    ]);

  const completedRoundIds = (rounds ?? [])
    .filter((r) => r.is_complete)
    .map((r) => r.id as number);

  const enrichedEntries = (entries ?? []).map((entry) => ({
    ...entry,
    picks: (entry.entry_picks ?? []).map(
      (ep: { player_id: string; players: { full_name: string } | null }) => ({
        player_id: ep.player_id,
        full_name: ep.players?.full_name ?? "Unknown",
      })
    ),
  }));

  // Check for "My Team" cookie
  const cookieStore = await cookies();
  const myToken = cookieStore.get(`entry_token_${poolId}`)?.value;
  const myEntry = myToken ? entries?.find((e) => e.token === myToken) : null;

  const deadlinePassed = isDeadlinePassed(pool.pick_deadline);

  return (
    <PoolPageClient
      pool={pool}
      poolId={poolId}
      entries={enrichedEntries}
      rounds={rounds ?? []}
      players={allPlayers ?? []}
      dbScores={allScores ?? []}
      completedRoundIds={completedRoundIds}
      myEntryId={myEntry?.id}
      deadlinePassed={deadlinePassed}
    />
  );
}
