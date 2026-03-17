"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PlayerAvatar from "@/components/shared/PlayerAvatar";

interface Pick {
  player_id: string;
  pick_slot: number;
  players: { full_name: string; photo_url: string | null; country: string } | null;
}

interface Entry {
  id: string;
  display_name: string;
  token: string;
  entry_picks: Pick[];
}

export default function FindMyPicks({ poolId }: { poolId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [results, setResults] = useState<Entry[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    const supabase = createClient();
    const { data } = await supabase
      .from("entries")
      .select("id, display_name, token, entry_picks(pick_slot, player_id, players(full_name, photo_url, country))")
      .eq("pool_id", poolId)
      .ilike("display_name", `%${name.trim()}%`);

    setResults((data as unknown as Entry[]) ?? []);
    setSearched(true);
    setLoading(false);
  }

  function claimEntry(entry: Entry) {
    // Set the cookie so this browser is now linked to this entry
    document.cookie = `entry_token_${poolId}=${entry.token}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    setClaimed(true);
    setTimeout(() => {
      router.push(`/pool/${poolId}/pick`);
      router.refresh();
    }, 1000);
  }

  if (claimed) {
    return (
      <div className="text-center py-10">
        <div className="text-4xl mb-3">✓</div>
        <p className="font-semibold text-gray-900">Got it! Taking you to your picks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-masters-green text-sm"
        />
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="px-4 py-2 bg-masters-green text-white font-semibold rounded-lg hover:bg-green-800 disabled:opacity-40 text-sm transition-colors"
        >
          {loading ? "..." : "Search"}
        </button>
      </form>

      {searched && results.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>No entries found for &quot;{name}&quot;</p>
          <p className="text-sm mt-1">Try a different spelling or partial name.</p>
        </div>
      )}

      {results.map((entry) => {
        const picks = [...(entry.entry_picks ?? [])].sort((a, b) => a.pick_slot - b.pick_slot);
        return (
          <div
            key={entry.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-gray-900">{entry.display_name}</span>
              <button
                onClick={() => claimEntry(entry)}
                className="text-sm px-4 py-1.5 bg-masters-green text-white font-semibold rounded-lg hover:bg-green-800 transition-colors"
              >
                This is me
              </button>
            </div>
            <div className="px-4 py-3 space-y-2">
              {picks.map((pick) => (
                <div key={pick.player_id} className="flex items-center gap-2.5">
                  <span className="text-xs text-gray-300 w-4 text-center">{pick.pick_slot}</span>
                  <PlayerAvatar
                    name={pick.players?.full_name ?? "?"}
                    photoUrl={pick.players?.photo_url ?? null}
                    size={28}
                  />
                  <span className="text-sm text-gray-800">{pick.players?.full_name ?? "Unknown"}</span>
                  <span className="text-xs text-gray-400 ml-auto">{pick.players?.country}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
