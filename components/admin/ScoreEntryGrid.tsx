"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Round } from "@/lib/types";
import { formatToPar } from "@/lib/scoring";
import { cn } from "@/lib/utils";

interface Player {
  id: string;
  full_name: string;
  country: string;
  world_ranking: number | null;
}

interface ExistingScore {
  player_id: string;
  round_id: number;
  to_par: number | null;
  strokes: number | null;
}

interface ScoreEntryGridProps {
  players: Player[];
  rounds: Round[];
  existingScores: ExistingScore[];
}

type ScoreMap = Record<string, Record<number, string>>; // player_id -> round_id -> value

export default function ScoreEntryGrid({
  players,
  rounds,
  existingScores,
}: ScoreEntryGridProps) {
  const [scores, setScores] = useState<ScoreMap>(() => {
    const map: ScoreMap = {};
    for (const s of existingScores) {
      if (!map[s.player_id]) map[s.player_id] = {};
      map[s.player_id][s.round_id] =
        s.to_par !== null ? String(s.to_par) : "";
    }
    return map;
  });
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [roundComplete, setRoundComplete] = useState<Record<number, boolean>>(
    Object.fromEntries(rounds.map((r) => [r.id, r.is_complete]))
  );
  const [activeRound, setActiveRound] = useState(rounds[0]?.id ?? 1);
  const [search, setSearch] = useState("");

  const supabase = createClient();

  const saveScore = useCallback(
    async (playerId: string, roundId: number) => {
      const key = `${playerId}-${roundId}`;
      const rawValue = scores[playerId]?.[roundId] ?? "";
      const toPar = rawValue === "" ? null : parseInt(rawValue, 10);

      if (rawValue !== "" && isNaN(toPar as number)) return;

      setSaving((s) => ({ ...s, [key]: true }));

      await supabase.from("scores").upsert(
        {
          player_id: playerId,
          round_id: roundId,
          to_par: toPar,
          strokes: toPar !== null ? 72 + toPar : null,
        },
        { onConflict: "player_id,round_id" }
      );

      setSaving((s) => ({ ...s, [key]: false }));
    },
    [scores, supabase]
  );

  async function toggleRoundComplete(roundId: number) {
    const newValue = !roundComplete[roundId];
    await supabase
      .from("rounds")
      .update({ is_complete: newValue })
      .eq("id", roundId);
    setRoundComplete((prev) => ({ ...prev, [roundId]: newValue }));
  }

  const filteredPlayers = players.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Round tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {rounds.map((round) => (
          <button
            key={round.id}
            onClick={() => setActiveRound(round.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeRound === round.id
                ? "bg-masters-green text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            )}
          >
            {round.label}
            {roundComplete[round.id] && " ✓"}
          </button>
        ))}
      </div>

      {/* Active round controls */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
          <div>
            <span className="font-semibold text-gray-700">
              {rounds.find((r) => r.id === activeRound)?.label}
            </span>
            <span className="text-sm text-gray-400 ml-3">
              Enter to_par (e.g. -5, 0, +3)
            </span>
          </div>
          <button
            onClick={() => toggleRoundComplete(activeRound)}
            className={cn(
              "text-sm px-4 py-1.5 rounded-lg font-medium transition-colors",
              roundComplete[activeRound]
                ? "bg-masters-green text-white hover:bg-green-800"
                : "bg-yellow-400 text-gray-900 hover:bg-yellow-500"
            )}
          >
            {roundComplete[activeRound] ? "✓ Round Complete" : "Mark Round Complete"}
          </button>
        </div>

        <div className="px-4 py-2 border-b border-gray-100">
          <input
            type="search"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-masters-green"
          />
        </div>

        <div className="divide-y divide-gray-50">
          {filteredPlayers.map((player) => {
            const key = `${player.id}-${activeRound}`;
            const value = scores[player.id]?.[activeRound] ?? "";
            const toPar = value === "" ? null : parseInt(value, 10);
            const isSaving = saving[key];

            return (
              <div
                key={player.id}
                className="flex items-center gap-4 px-4 py-2.5 hover:bg-gray-50"
              >
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    {player.full_name}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">{player.country}</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Live to_par display */}
                  <span
                    className={cn(
                      "text-sm font-mono w-8 text-right",
                      toPar !== null && toPar < 0 && "text-red-600 font-semibold",
                      toPar === 0 && "text-gray-700",
                      toPar !== null && toPar > 0 && "text-gray-400"
                    )}
                  >
                    {toPar !== null ? formatToPar(toPar) : ""}
                  </span>

                  <input
                    type="number"
                    value={value}
                    onChange={(e) =>
                      setScores((prev) => ({
                        ...prev,
                        [player.id]: {
                          ...prev[player.id],
                          [activeRound]: e.target.value,
                        },
                      }))
                    }
                    onBlur={() => saveScore(player.id, activeRound)}
                    placeholder="—"
                    className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-masters-green"
                  />

                  <span className="text-xs text-gray-300 w-4">
                    {isSaving ? "⟳" : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
