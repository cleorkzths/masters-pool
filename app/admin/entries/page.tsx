import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminEntriesPage() {
  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("entries")
    .select("*, pools(name), entry_picks(player_id, players(full_name))")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Entries ({entries?.length ?? 0})
      </h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <div>Team Name</div>
          <div>Players</div>
          <div>Paid</div>
          <div>View</div>
        </div>

        {(entries ?? []).map((entry) => {
          const picks = (entry.entry_picks ?? []) as Array<{
            player_id: string;
            players: { full_name: string } | null;
          }>;

          return (
            <div
              key={entry.id}
              className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 items-start px-4 py-3 border-b border-gray-50 hover:bg-gray-50"
            >
              <div>
                <div className="font-medium text-sm text-gray-900">
                  {entry.display_name}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(entry.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="text-xs text-gray-600 space-y-0.5">
                {picks.map((p) => (
                  <div key={p.player_id}>{p.players?.full_name ?? "?"}</div>
                ))}
              </div>

              <div className="flex items-center justify-center">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    entry.is_paid
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {entry.is_paid ? "Paid" : "Unpaid"}
                </span>
              </div>

              <Link
                href={`/pool/${entry.pool_id}/entry/${entry.id}`}
                className="text-xs text-masters-green hover:underline"
              >
                View →
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
