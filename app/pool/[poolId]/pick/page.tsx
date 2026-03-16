import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import PlayerPicker from "@/components/picker/PlayerPicker";
import { isDeadlinePassed } from "@/lib/utils";
import { cookies } from "next/headers";

export default async function PickPage({
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

  if (isDeadlinePassed(pool.pick_deadline)) {
    redirect(`/pool/${poolId}`);
  }

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("is_active", true)
    .order("world_ranking", { ascending: true, nullsFirst: false });

  // Check if this browser already has an entry via token cookie
  const cookieStore = await cookies();
  const token = cookieStore.get(`entry_token_${poolId}`)?.value ?? null;

  let existingEntry = null;
  if (token) {
    const { data } = await supabase
      .from("entries")
      .select("*, entry_picks(player_id, pick_slot)")
      .eq("pool_id", poolId)
      .eq("token", token)
      .single();
    existingEntry = data;
  }

  const existingPicks = existingEntry?.entry_picks ?? [];

  return (
    <PlayerPicker
      players={players ?? []}
      poolId={poolId}
      pool={pool}
      existingEntry={existingEntry}
      existingPicks={existingPicks}
      existingToken={token}
    />
  );
}
