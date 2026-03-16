import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: playerCount },
    { count: entryCount },
    { data: pools },
    { data: rounds },
  ] = await Promise.all([
    supabase.from("players").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("entries").select("*", { count: "exact", head: true }),
    supabase.from("pools").select("*").order("year", { ascending: false }),
    supabase.from("rounds").select("*").order("id"),
  ]);

  const completedRounds = (rounds ?? []).filter((r) => r.is_complete).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active Players", value: playerCount ?? 0 },
          { label: "Entries", value: entryCount ?? 0 },
          { label: "Rounds Complete", value: `${completedRounds}/4` },
          { label: "Pools", value: pools?.length ?? 0 },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-masters-green">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link href="/admin/scores" className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="text-2xl mb-2">📊</div>
          <div className="font-semibold text-gray-900">Enter Scores</div>
          <div className="text-sm text-gray-500 mt-1">Add round scores for all players</div>
        </Link>
        <Link href="/admin/players" className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="text-2xl mb-2">📸</div>
          <div className="font-semibold text-gray-900">Manage Players</div>
          <div className="text-sm text-gray-500 mt-1">Upload photos, edit the field</div>
        </Link>
        <Link href="/admin/entries" className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="text-2xl mb-2">📋</div>
          <div className="font-semibold text-gray-900">Manage Entries</div>
          <div className="text-sm text-gray-500 mt-1">View all picks, mark paid</div>
        </Link>
      </div>

      {/* Pools */}
      {pools && pools.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold text-gray-700 mb-3">Active Pools</h2>
          <div className="space-y-2">
            {pools.map((pool) => (
              <div key={pool.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{pool.name}</div>
                  <div className="text-sm text-gray-400">
                    Deadline: {new Date(pool.pick_deadline).toLocaleString()}
                  </div>
                </div>
                <Link
                  href={`/pool/${pool.id}`}
                  className="text-sm text-masters-green hover:underline"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
