"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { buildLeaderboard, formatToPar } from "@/lib/scoring";
import ToParBadge from "@/components/shared/ToParBadge";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface EntryWithPicks {
  id: string;
  display_name: string;
  user_id: string;
  pool_id: string;
  picks: Array<{ player_id: string; full_name: string }>;
}

interface PlayerInfo {
  id: string;
  full_name: string;
  photo_url: string | null;
  country: string;
}

interface RoundInfo {
  id: number;
  label: string;
  round_date: string;
  is_complete: boolean;
}

interface DbScore {
  player_id: string;
  round_id: number;
  to_par: number | null;
}

interface EspnPlayer {
  name: string;
  toPar: number | null;
  position: string;
  status: string;
  rounds: (number | null)[];
  wd: boolean;
}

interface EspnData {
  players: EspnPlayer[];
  eventName: string | null;
  lastUpdated: string | null;
}

interface Props {
  pool: { id: string; name: string; year: number; scoring_keep: number; pick_deadline: string };
  poolId: string;
  entries: EntryWithPicks[];
  rounds: RoundInfo[];
  players: PlayerInfo[];
  dbScores: DbScore[];
  completedRoundIds: number[];
  myEntryId?: string;
  deadlinePassed: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    // Transliterate non-decomposing chars that NFD won't strip (e.g. Danish ø → o)
    .replace(/ø/g, "o")
    .replace(/æ/g, "ae")
    .replace(/å/g, "a")
    .replace(/ð/g, "d")
    .replace(/þ/g, "th")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

function positionLabel(pos: number, idx: number, all: { total_to_par: number }[]): string {
  const tied =
    (idx > 0 && all[idx].total_to_par === all[idx - 1].total_to_par) ||
    (idx < all.length - 1 && all[idx].total_to_par === all[idx + 1].total_to_par);
  return tied ? `T${pos}` : `${pos}`;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PoolPageClient({
  pool,
  poolId,
  entries,
  rounds,
  players,
  dbScores,
  completedRoundIds,
  myEntryId,
  deadlinePassed,
}: Props) {
  const [activeTab, setActiveTab] = useState<"standings" | "field">("standings");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [espnData, setEspnData] = useState<EspnData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [espnError, setEspnError] = useState(false);

  // ── Fetch ESPN live scores ──────────────────────────────────────────────────

  const fetchScores = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/espn-scores");
      if (res.ok) {
        const data: EspnData = await res.json();
        if (data.players?.length) {
          setEspnData(data);
          setLastUpdated(data.lastUpdated);
          setEspnError(false);
        } else {
          setEspnError(true);
        }
      }
    } catch {
      setEspnError(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchScores();
    const interval = setInterval(fetchScores, 60_000);
    return () => clearInterval(interval);
  }, [fetchScores]);

  // ── Name → player ID map (from DB) ─────────────────────────────────────────

  const nameToId = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of players) {
      map.set(normalizeName(p.full_name), p.id);
    }
    return map;
  }, [players]);

  // ── Build live scoresMap + active rounds ───────────────────────────────────

  const { liveScoresMap, liveActiveRounds } = useMemo(() => {
    // Fallback: use DB scores when ESPN not available
    if (!espnData?.players?.length) {
      const fallback = new Map<string, Map<number, number | null>>();
      for (const s of dbScores) {
        if (!fallback.has(s.player_id)) fallback.set(s.player_id, new Map());
        fallback.get(s.player_id)!.set(s.round_id, s.to_par);
      }
      return { liveScoresMap: fallback, liveActiveRounds: completedRoundIds };
    }

    const scoresMap = new Map<string, Map<number, number | null>>();

    for (const ep of espnData.players) {
      const playerId = nameToId.get(normalizeName(ep.name));
      if (!playerId) continue;

      const roundMap = new Map<number, number | null>();
      ep.rounds.forEach((score, idx) => {
        const roundId = idx + 1;
        if (score !== null) {
          roundMap.set(roundId, score);
        } else if (ep.wd) {
          // WD / missed-cut player → null → triggers +10 fill-in in scoring
          roundMap.set(roundId, null);
        } else {
          // Not started yet in this round → treat as even par (0) so no fill-in penalty
          roundMap.set(roundId, 0);
        }
      });
      scoresMap.set(playerId, roundMap);
    }

    // Determine which rounds have started (at least one player has a non-null score)
    // Note: 0 = "E" (even par, round in progress), null = not yet started
    const activeRounds: number[] = [];
    for (let r = 1; r <= 4; r++) {
      const hasStarted = espnData.players.some((ep) => ep.rounds[r - 1] !== null);
      if (hasStarted) activeRounds.push(r);
    }

    // If ESPN has no real round data, fall back to DB
    if (activeRounds.length === 0) {
      const fallback = new Map<string, Map<number, number | null>>();
      for (const s of dbScores) {
        if (!fallback.has(s.player_id)) fallback.set(s.player_id, new Map());
        fallback.get(s.player_id)!.set(s.round_id, s.to_par);
      }
      return { liveScoresMap: fallback, liveActiveRounds: completedRoundIds };
    }

    return { liveScoresMap: scoresMap, liveActiveRounds: activeRounds };
  }, [espnData, nameToId, dbScores, completedRoundIds]);

  // ── Leaderboard ────────────────────────────────────────────────────────────

  const leaderboard = useMemo(
    () => buildLeaderboard(entries, liveScoresMap, liveActiveRounds, pool.scoring_keep),
    [entries, liveScoresMap, liveActiveRounds, pool.scoring_keep]
  );

  // ── Field tab: ESPN players sorted by score ────────────────────────────────

  const fieldPlayers = useMemo(() => {
    const source = espnData?.players?.length ? espnData.players : null;
    if (!source) return null;

    const playerById = new Map(players.map((p) => [p.id, p]));

    const getLiveTotal = (ep: EspnPlayer): number | null => {
      const played = liveActiveRounds
        .map((r) => ep.rounds[r - 1])
        .filter((s): s is number => s !== null);
      return played.length === 0 ? null : played.reduce((sum, s) => sum + s, 0);
    };

    return [...source]
      .map((ep) => {
        const id = nameToId.get(normalizeName(ep.name));
        const db = id ? playerById.get(id) : undefined;
        return { ...ep, country: db?.country ?? "" };
      })
      .sort((a, b) => {
        const ta = getLiveTotal(a);
        const tb = getLiveTotal(b);
        if (ta === null && tb === null) return 0;
        if (ta === null) return 1;
        if (tb === null) return -1;
        return ta - tb;
      });
  }, [espnData, players, nameToId, liveActiveRounds]);

  // ── Status banner ──────────────────────────────────────────────────────────

  const statusLabel = useMemo(() => {
    if (liveActiveRounds.length === 0) return "Tournament hasn't started yet";
    const isLive = !!espnData?.players?.length;
    const roundNum = liveActiveRounds[liveActiveRounds.length - 1];
    if (liveActiveRounds.length === 4) return isLive ? "Live · Final Round" : "Tournament complete";
    return isLive ? `Live · Round ${roundNum}` : `After Round ${liveActiveRounds.length}`;
  }, [liveActiveRounds, espnData]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Pool header */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{pool.name}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {statusLabel}
            {" · "}
            {leaderboard.length} {leaderboard.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        <div className="flex gap-3">
          {myEntryId && (
            <Link
              href={`/pool/${poolId}/entry/${myEntryId}`}
              className="px-5 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors text-sm"
            >
              My Team
            </Link>
          )}
          {deadlinePassed ? (
            <span className="px-5 py-2 bg-gray-100 text-gray-400 font-semibold rounded-lg text-sm cursor-not-allowed select-none">
              🔒 Picks Locked
            </span>
          ) : (
            <Link
              href={`/pool/${poolId}/pick`}
              className="px-5 py-2 bg-masters-green text-white font-semibold rounded-lg hover:bg-green-800 transition-colors text-sm"
            >
              {myEntryId ? "Edit My Picks" : "Make My Picks"}
            </Link>
          )}
        </div>
      </div>

      {/* Round pip indicators */}
      {rounds.length > 0 && (
        <div className="flex gap-2 mb-5">
          {rounds.map((round) => {
            const isActive = liveActiveRounds.includes(round.id);
            return (
              <div
                key={round.id}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium",
                  isActive ? "bg-masters-green text-white" : "bg-gray-200 text-gray-500"
                )}
              >
                R{round.id} {isActive ? "✓" : ""}
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center border-b border-gray-200 mb-5">
        <button
          onClick={() => setActiveTab("standings")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === "standings"
              ? "border-masters-green text-masters-green"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          Pool Standings
        </button>
        <button
          onClick={() => setActiveTab("field")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === "field"
              ? "border-masters-green text-masters-green"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          Field Scores
        </button>
        <div className="ml-auto flex items-center gap-2 pb-1">
          {lastUpdated && (
            <span className="text-xs text-gray-400 hidden sm:block">
              Live · {new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {espnError && (
            <span className="text-xs text-amber-500 hidden sm:block">Using cached scores</span>
          )}
          <button
            onClick={fetchScores}
            disabled={refreshing}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            title="Refresh scores"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "standings" && (
        <StandingsTab
          leaderboard={leaderboard}
          liveActiveRounds={liveActiveRounds}
          poolId={poolId}
          myEntryId={myEntryId}
          expandedId={expandedId}
          onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
        />
      )}

      {activeTab === "field" && (
        <FieldTab
          players={fieldPlayers}
          liveActiveRounds={liveActiveRounds}
          loading={!espnData && !espnError}
        />
      )}
    </div>
  );
}

// ── Standings Tab ─────────────────────────────────────────────────────────────

type LeaderboardEntry = ReturnType<typeof buildLeaderboard>[number];

function StandingsTab({
  leaderboard,
  liveActiveRounds,
  poolId,
  myEntryId,
  expandedId,
  onToggle,
}: {
  leaderboard: LeaderboardEntry[];
  liveActiveRounds: number[];
  poolId: string;
  myEntryId?: string;
  expandedId: string | null;
  onToggle: (id: string) => void;
}) {
  if (leaderboard.length === 0) return null;

  const hasScores = liveActiveRounds.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      {/* Header row */}
      <div className="grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[3rem_1fr_6rem_6rem] px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        <div>Pos</div>
        <div>Name</div>
        <div className="hidden sm:block text-right">Rounds</div>
        <div className="text-right">Score</div>
      </div>

      {leaderboard.map((entry, idx) => {
        const isMe = entry.entry_id === myEntryId;
        const isExpanded = expandedId === entry.entry_id;
        const pos = positionLabel(entry.position, idx, leaderboard);

        return (
          <div key={entry.entry_id}>
            {/* Main row — click to expand */}
            <button
              onClick={() => onToggle(entry.entry_id)}
              className={cn(
                "w-full grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[3rem_1fr_6rem_6rem] px-4 py-3.5 border-b border-gray-50 transition-colors text-left",
                isMe ? "bg-yellow-50 hover:bg-yellow-100" : "hover:bg-gray-50",
                isExpanded && "border-b-0"
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
                <span className="ml-1 text-gray-400">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </span>
              </div>

              <div className="hidden sm:flex items-center justify-end">
                <span className="text-sm text-gray-400">
                  {hasScores ? `${entry.rounds_played}/4` : "—"}
                </span>
              </div>

              <div className="flex items-center justify-end">
                {hasScores ? (
                  <ToParBadge toPar={entry.total_to_par} />
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </div>
            </button>

            {/* Expanded player details */}
            {isExpanded && (
              <ExpandedEntry
                entry={entry}
                liveActiveRounds={liveActiveRounds}
                isMe={isMe}
                poolId={poolId}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Expanded entry row ────────────────────────────────────────────────────────

function ExpandedEntry({
  entry,
  liveActiveRounds,
  isMe,
  poolId,
}: {
  entry: LeaderboardEntry;
  liveActiveRounds: number[];
  isMe: boolean;
  poolId: string;
}) {
  // Build per-player, per-round detail from round_results
  const playerRows = useMemo(() => {
    return entry.picks.map((pick) => {
      const perRound = liveActiveRounds.map((roundId) => {
        const rr = entry.round_results.find((r) => r.round_id === roundId);
        return rr?.player_details.find((pd) => pd.player_id === pick.player_id) ?? null;
      });

      // Player total (only rounds where their score counted, including fill-ins)
      const total = perRound.reduce((sum, pd) => {
        if (!pd || pd.is_dropped) return sum;
        if (pd.is_fill_in) return sum + 10;
        return sum + (pd.to_par ?? 0);
      }, 0);

      const hasAnyScore = perRound.some((pd) => pd !== null);
      return { pick, perRound, total, hasAnyScore };
    });
  }, [entry, liveActiveRounds]);

  const numRounds = liveActiveRounds.length;
  const gridCols =
    numRounds === 0
      ? "grid-cols-[1fr]"
      : numRounds === 1
      ? "grid-cols-[1fr_3rem]"
      : numRounds === 2
      ? "grid-cols-[1fr_3rem_3rem]"
      : numRounds === 3
      ? "grid-cols-[1fr_3rem_3rem_3rem]"
      : "grid-cols-[1fr_3rem_3rem_3rem_3rem]";

  return (
    <div className={cn("border-b border-gray-100 px-4 pb-4 pt-2", isMe ? "bg-yellow-50" : "bg-gray-50/60")}>
      {/* Column headers */}
      <div className={cn("grid text-xs font-medium text-gray-400 uppercase tracking-wide mb-1", gridCols)}>
        <div className="pl-1">Player</div>
        {liveActiveRounds.map((r) => (
          <div key={r} className="text-right">
            R{r}
          </div>
        ))}
      </div>

      {/* Player rows */}
      {playerRows.map(({ pick, perRound, total, hasAnyScore }) => (
        <div key={pick.player_id} className={cn("grid items-center py-1.5", gridCols)}>
          <div className="pl-1 text-sm font-medium text-gray-800 truncate pr-2">
            {pick.full_name}
          </div>

          {perRound.map((pd, rIdx) => (
            <div key={rIdx} className="text-right">
              {pd ? (
                <span
                  className={cn(
                    "text-xs font-mono",
                    pd.is_dropped && "line-through opacity-40 text-gray-400",
                    !pd.is_dropped && pd.is_fill_in && "text-amber-500 font-semibold",
                    !pd.is_dropped && !pd.is_fill_in && pd.to_par !== null && pd.to_par < 0 && "text-red-600 font-semibold",
                    !pd.is_dropped && !pd.is_fill_in && pd.to_par !== null && pd.to_par === 0 && "text-gray-700",
                    !pd.is_dropped && !pd.is_fill_in && pd.to_par !== null && pd.to_par > 0 && "text-gray-500"
                  )}
                  title={
                    pd.is_fill_in
                      ? "Fill-in score (+10) — missed cut or WD"
                      : pd.is_dropped
                      ? "Dropped (not in best 4)"
                      : "Counting"
                  }
                >
                  {pd.is_fill_in ? "+10*" : formatToPar(pd.to_par)}
                </span>
              ) : (
                <span className="text-xs text-gray-300">—</span>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Round totals */}
      {liveActiveRounds.length > 0 && (
        <div className={cn("grid items-center border-t border-gray-200 mt-2 pt-2", gridCols)}>
          <div className="pl-1 text-xs font-semibold text-gray-500 uppercase">Team total</div>
          {liveActiveRounds.map((roundId) => {
            const rr = entry.round_results.find((r) => r.round_id === roundId);
            return (
              <div key={roundId} className="text-right">
                <span className={cn(
                  "text-xs font-mono font-semibold",
                  rr?.round_total !== null && rr?.round_total !== undefined && rr.round_total < 0 && "text-red-600",
                  rr?.round_total !== null && rr?.round_total !== undefined && rr.round_total === 0 && "text-gray-700",
                  rr?.round_total !== null && rr?.round_total !== undefined && rr.round_total > 0 && "text-gray-500",
                )}>
                  {rr?.round_total !== null && rr?.round_total !== undefined ? formatToPar(rr.round_total) : "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 text-right">
        <Link
          href={`/pool/${poolId}/entry/${entry.entry_id}`}
          className="text-xs text-masters-green hover:underline"
        >
          Full scorecard →
        </Link>
      </div>
    </div>
  );
}

// ── Field Scores Tab ──────────────────────────────────────────────────────────

function FieldTab({
  players,
  liveActiveRounds,
  loading,
}: {
  players: (EspnPlayer & { country: string })[] | null;
  liveActiveRounds: number[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="text-center py-16 text-gray-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3" />
        <p>Loading live scores…</p>
      </div>
    );
  }

  if (!players || players.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-5xl mb-4">⛳</div>
        <p>No live scores available yet.</p>
        <p className="text-sm mt-2">Scores will appear once the tournament begins.</p>
      </div>
    );
  }

  const numRounds = liveActiveRounds.length;
  const gridClass =
    numRounds === 0
      ? "grid-cols-[2rem_1fr_4rem]"
      : numRounds === 1
      ? "grid-cols-[2.5rem_1fr_3.5rem_4rem]"
      : numRounds === 2
      ? "grid-cols-[2.5rem_1fr_3.5rem_3.5rem_4rem]"
      : numRounds === 3
      ? "grid-cols-[2.5rem_1fr_3.5rem_3.5rem_3.5rem_4rem]"
      : "grid-cols-[2.5rem_1fr_3.5rem_3.5rem_3.5rem_3.5rem_4rem]";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className={cn("grid px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide", gridClass)}>
        <div>Pos</div>
        <div>Player</div>
        {liveActiveRounds.map((r) => (
          <div key={r} className="text-right">R{r}</div>
        ))}
        <div className="text-right">Total</div>
      </div>

      {players.map((player, idx) => (
        <div
          key={player.name}
          className={cn(
            "grid items-center px-4 py-3 border-b border-gray-50",
            gridClass,
            idx % 2 === 1 && "bg-gray-50/30"
          )}
        >
          {/* Position */}
          <div className="text-xs font-medium text-gray-500">
            {player.wd ? (
              <span className="text-gray-400">{player.position}</span>
            ) : player.position ? (
              player.position
            ) : (
              `${idx + 1}`
            )}
          </div>

          {/* Name + country */}
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{player.name}</div>
            {player.country && (
              <div className="text-xs text-gray-400">{player.country}</div>
            )}
          </div>

          {/* Per-round scores */}
          {liveActiveRounds.map((_, rIdx) => {
            const score = player.rounds[rIdx];
            return (
              <div key={rIdx} className="text-right">
                <span
                  className={cn(
                    "text-sm font-mono",
                    score === null && "text-gray-300",
                    score !== null && score < 0 && "text-red-600 font-semibold",
                    score !== null && score === 0 && "text-gray-700",
                    score !== null && score > 0 && "text-gray-500"
                  )}
                >
                  {score === null ? "—" : formatToPar(score)}
                </span>
              </div>
            );
          })}

          {/* Total — sum round scores directly so it updates live mid-round */}
          <div className="text-right">
            {player.wd ? (
              <span className="text-xs text-gray-400">{player.position}</span>
            ) : (() => {
              const played = liveActiveRounds
                .map((r) => player.rounds[r - 1])
                .filter((s): s is number => s !== null);
              if (played.length === 0) return <span className="text-sm text-gray-300">—</span>;
              return <ToParBadge toPar={played.reduce((sum, s) => sum + s, 0)} />;
            })()}
          </div>
        </div>
      ))}
    </div>
  );
}
