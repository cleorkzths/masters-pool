import { createClient } from "@/lib/supabase/server";
import AdminPlayersClient from "@/components/admin/AdminPlayersClient";

export default async function AdminPlayersPage() {
  const supabase = await createClient();

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .order("world_ranking", { ascending: true, nullsFirst: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Manage Players</h1>
      <p className="text-sm text-gray-500 mb-6">
        Upload player photos, activate/deactivate players, and edit the field.
      </p>
      <AdminPlayersClient players={players ?? []} />
    </div>
  );
}
