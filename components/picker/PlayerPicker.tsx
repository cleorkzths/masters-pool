"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import PlayerCard from "./PlayerCard";
import SelectedTeam from "./SelectedTeam";
import type { Player, Pool } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

interface ExistingEntry { id: string; display_name: string; token: string; }
interface ExistingPick { player_id: string; pick_slot: number; }

interface PlayerPickerProps {
  players: Player[];
  poolId: string;
  pool: Pool;
  existingEntry: ExistingEntry | null;
  existingPicks: ExistingPick[];
  existingToken: string | null;
}

type SortKey = "salary_asc" | "salary_desc" | "ranking";

export default function PlayerPicker({
  players, poolId, pool, existingEntry, existingPicks, existingToken,
}: PlayerPickerProps) {
  const router = useRouter();
  const maxPicks = pool.max_picks;
  const salaryCap = pool.salary_cap ?? 1000;

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("salary_desc");
  const [selectedIds, setSelectedIds] = useState<string[]>(
    existingPicks.sort((a, b) => a.pick_slot - b.pick_slot).map((p) => p.player_id)
  );
  const [displayName, setDisplayName] = useState(existingEntry?.display_name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedPlayers = selectedIds
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean) as Player[];

  const salaryUsed = selectedPlayers.reduce((sum, p) => sum + p.salary, 0);
  const salaryLeft = salaryCap - salaryUsed;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const results = players.filter(
      (p) => p.full_name.toLowerCase().includes(q) || p.country.toLowerCase().includes(q)
    );
    if (sortKey === "salary_desc") return [...results].sort((a, b) => b.salary - a.salary);
    if (sortKey === "salary_asc") return [...results].sort((a, b) => a.salary - b.salary);
    return results; // ranking (default order from DB)
  }, [players, search, sortKey]);

  function togglePlayer(playerId: string) {
    setSelectedIds((prev) => {
      if (prev.includes(playerId)) return prev.filter((id) => id !== playerId);
      if (prev.length >= maxPicks) return prev;
      return [...prev, playerId];
    });
  }

  function removePlayer(playerId: string) {
    setSelectedIds((prev) => prev.filter((id) => id !== playerId));
  }

  async function handleSave() {
    if (selectedIds.length !== maxPicks) { setError(`Select exactly ${maxPicks} players.`); return; }
    if (!displayName.trim()) { setError("Enter your name."); return; }
    if (salaryLeft < 0) { setError(`Over budget by $${Math.abs(salaryLeft)}.`); return; }

    setSaving(true);
    setError("");
    const supabase = createClient();

    try {
      let entryId = existingEntry?.id;
      let token = existingToken;

      if (entryId && token) {
        await supabase.from("entries").update({ display_name: displayName.trim(), updated_at: new Date().toISOString() }).eq("id", entryId).eq("token", token);
        await supabase.from("entry_picks").delete().eq("entry_id", entryId);
      } else {
        const { data: newEntry, error: entryError } = await supabase
          .from("entries").insert({ pool_id: poolId, display_name: displayName.trim() }).select("id, token").single();
        if (entryError || !newEntry) throw entryError ?? new Error("Failed to create entry");
        entryId = newEntry.id;
        token = newEntry.token;
        document.cookie = `entry_token_${poolId}=${token}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
      }

      const { error: picksError } = await supabase.from("entry_picks").insert(
        selectedIds.map((player_id, i) => ({ entry_id: entryId!, player_id, pick_slot: i + 1 }))
      );
      if (picksError) throw picksError;

      router.push(`/pool/${poolId}/entry/${entryId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left: player list */}
      <div className="flex-1 min-w-0">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {existingEntry ? "Edit Your Team" : "Make Your Picks"}
          </h1>
          <p className="text-gray-500 text-sm">
            Pick {maxPicks} players within the ${salaryCap.toLocaleString()} salary cap. Best {pool.scoring_keep} of {maxPicks} scores count each round.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. John Smith"
            maxLength={40}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-masters-green text-sm"
          />
        </div>

        {/* Search + sort */}
        <div className="flex gap-2 mb-4">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-masters-green text-sm"
          />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-masters-green bg-white"
          >
            <option value="ranking">By ranking</option>
            <option value="salary_desc">$ High to low</option>
            <option value="salary_asc">$ Low to high</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filtered.map((player) => {
            const isSelected = selectedIds.includes(player.id);
            const wouldOverBudget = !isSelected && salaryLeft < player.salary;
            return (
              <PlayerCard
                key={player.id}
                player={player}
                isSelected={isSelected}
                isFull={selectedIds.length >= maxPicks && !isSelected}
                isOverBudget={wouldOverBudget}
                onToggle={() => togglePlayer(player.id)}
              />
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-400">No players found for &quot;{search}&quot;</div>
        )}
      </div>

      {/* Right: salary + picks panel */}
      <div className="lg:w-72 lg:flex-shrink-0">
        <div className="lg:sticky lg:top-6">
          <SelectedTeam
            players={selectedPlayers}
            maxPicks={maxPicks}
            salaryCap={salaryCap}
            onRemove={removePlayer}
            onSave={handleSave}
            saving={saving}
            error={error}
            displayName={displayName}
          />
        </div>
      </div>
    </div>
  );
}
