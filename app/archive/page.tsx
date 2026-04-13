import { createClient } from "@/lib/supabase/server";
import { formatToPar } from "@/lib/scoring";
import Link from "next/link";

export const revalidate = 300;

const TOURNAMENT_EMOJI: Record<string, string> = {
  "Masters": "🌿",
  "PGA Championship": "🏆",
  "US Open": "🦅",
  "The Open Championship": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
};

interface ResultEntry {
  position: number;
  display_name: string;
  total_to_par: number;
  round_totals: number[];
  picks: string[];
}

export default async function ArchivePage() {
  const supabase = await createClient();
  const { data: archives } = await supabase
    .from("pool_results")
    .select("*")
    .order("year", { ascending: false })
    .order("completed_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="masters-header text-white shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⛳</span>
            <div>
              <div className="font-bold text-lg leading-tight">Pool History</div>
              <div className="text-xs text-green-200">Past Tournament Results</div>
            </div>
          </div>
          <Link href="/" className="text-sm text-green-200 hover:text-white transition-colors">
            ← Current Pool
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {!archives || archives.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-lg font-medium">No archived results yet.</p>
            <p className="text-sm mt-2">Archive a completed pool from the admin dashboard.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {archives.map((archive) => {
              const results: ResultEntry[] = archive.results ?? [];
              const winner = results[0];
              const emoji = TOURNAMENT_EMOJI[archive.tournament] ?? "🏌️";
              const date = new Date(archive.completed_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
              });

              return (
                <div key={archive.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Tournament header */}
                  <div className="bg-masters-green px-5 py-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-green-200 uppercase tracking-wide mb-0.5">
                          {archive.tournament} · {archive.year}
                        </div>
                        <div className="font-bold text-lg">{archive.pool_name}</div>
                      </div>
                      <div className="text-3xl">{emoji}</div>
                    </div>
                    {winner && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-green-100">
                        <span>Winner:</span>
                        <span className="font-semibold text-white">{winner.display_name}</span>
                        <span className="font-mono text-green-200">{formatToPar(winner.total_to_par)}</span>
                      </div>
                    )}
                  </div>

                  {/* Standings table */}
                  <div>
                    {/* Header */}
                    <div className="grid grid-cols-[2.5rem_1fr_repeat(4,3rem)_4rem] px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      <div>Pos</div>
                      <div>Team</div>
                      <div className="text-right">R1</div>
                      <div className="text-right">R2</div>
                      <div className="text-right">R3</div>
                      <div className="text-right">R4</div>
                      <div className="text-right">Total</div>
                    </div>

                    {results.map((entry, idx) => (
                      <div
                        key={entry.display_name}
                        className={`border-b border-gray-50 ${idx % 2 === 1 ? "bg-gray-50/40" : ""}`}
                      >
                        <div className="grid grid-cols-[2.5rem_1fr_repeat(4,3rem)_4rem] px-4 py-2.5 items-center">
                          <div className="text-sm font-bold">
                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : (
                              <span className="text-gray-400">{entry.position}</span>
                            )}
                          </div>
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {entry.display_name}
                          </div>
                          {[0, 1, 2, 3].map((rIdx) => (
                            <div key={rIdx} className="text-right">
                              <span className={`text-xs font-mono ${
                                entry.round_totals[rIdx] === undefined ? "text-gray-300" :
                                entry.round_totals[rIdx] < 0 ? "text-red-600 font-semibold" :
                                entry.round_totals[rIdx] === 0 ? "text-gray-600" : "text-gray-500"
                              }`}>
                                {entry.round_totals[rIdx] === undefined ? "—" : formatToPar(entry.round_totals[rIdx])}
                              </span>
                            </div>
                          ))}
                          <div className="text-right">
                            <span className={`text-sm font-semibold font-mono ${
                              entry.total_to_par < 0 ? "text-red-600" :
                              entry.total_to_par === 0 ? "text-gray-700" : "text-gray-500"
                            }`}>
                              {formatToPar(entry.total_to_par)}
                            </span>
                          </div>
                        </div>
                        {/* Picks */}
                        <div className="px-4 pb-2.5 -mt-1">
                          <div className="pl-10 text-xs text-gray-400 truncate">
                            {entry.picks.join(" · ")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-4 py-2.5 text-xs text-gray-400 bg-gray-50 border-t border-gray-100">
                    {results.length} {results.length === 1 ? "entry" : "entries"} · Archived {date}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
