"use client";

import Link from "next/link";
import ToParBadge from "@/components/shared/ToParBadge";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  entry_id: string;
  display_name: string;
  user_id: string;
  pool_id: string;
  total_to_par: number;
  rounds_played: number;
  position: number;
}

interface LeaderboardTableProps {
  leaderboard: LeaderboardEntry[];
  poolId: string;
  myEntryId?: string;
  completedRounds: number[];
}

function positionLabel(pos: number, idx: number, all: LeaderboardEntry[]): string {
  const tied =
    (idx > 0 && all[idx].total_to_par === all[idx - 1].total_to_par) ||
    (idx < all.length - 1 && all[idx].total_to_par === all[idx + 1].total_to_par);
  return tied ? `T${pos}` : `${pos}`;
}

export default function LeaderboardTable({
  leaderboard,
  poolId,
  myEntryId,
  completedRounds,
}: LeaderboardTableProps) {
  if (leaderboard.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <div className="grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[3rem_1fr_6rem_6rem] px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        <div>Pos</div>
        <div>Name</div>
        <div className="hidden sm:block text-right">Rounds</div>
        <div className="text-right">Score</div>
      </div>

      {leaderboard.map((entry, idx) => {
        const isMe = entry.entry_id === myEntryId;
        const pos = positionLabel(entry.position, idx, leaderboard);

        return (
          <Link
            key={entry.entry_id}
            href={`/pool/${poolId}/entry/${entry.entry_id}`}
            className={cn(
              "grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[3rem_1fr_6rem_6rem] px-4 py-3.5 border-b border-gray-50 leaderboard-row transition-colors",
              isMe && "bg-yellow-50 hover:bg-yellow-100"
            )}
          >
            <div className="flex items-center">
              <span
                className={cn(
                  "text-sm font-bold",
                  idx === 0 && "text-yellow-600",
                  idx === 1 && "text-gray-400",
                  idx === 2 && "text-amber-700",
                  idx > 2 && "text-gray-400"
                )}
              >
                {pos}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={cn("font-medium text-gray-900", isMe && "font-bold")}>
                {entry.display_name}
              </span>
              {isMe && (
                <span className="text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded-full font-medium">
                  You
                </span>
              )}
            </div>

            <div className="hidden sm:flex items-center justify-end">
              <span className="text-sm text-gray-400">
                {completedRounds.length > 0 ? `${entry.rounds_played}/4` : "—"}
              </span>
            </div>

            <div className="flex items-center justify-end">
              {completedRounds.length > 0 ? (
                <ToParBadge toPar={entry.total_to_par} />
              ) : (
                <span className="text-sm text-gray-400">—</span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
