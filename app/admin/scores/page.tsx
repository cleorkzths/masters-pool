import { createClient } from "@/lib/supabase/server";
import ScoreEntryGrid from "@/components/admin/ScoreEntryGrid";

export default async function AdminScoresPage() {
  const supabase = await createClient();

  const [{ data: players }, { data: rounds }, { data: scores }] =
    await Promise.all([
      supabase
        .from("players")
        .select("id, full_name, country, world_ranking")
        .eq("is_active", true)
        .order("world_ranking", { ascending: true, nullsFirst: false }),
      supabase.from("rounds").select("*").order("id"),
      supabase.from("scores").select("*"),
    ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Enter Scores</h1>
      <p className="text-sm text-gray-500 mb-6">
        Enter to_par scores (e.g. -3 for birdie-birdie-birdie round). Leave blank for players who did not play/WD.
      </p>

      <ScoreEntryGrid
        players={players ?? []}
        rounds={rounds ?? []}
        existingScores={scores ?? []}
      />
    </div>
  );
}
