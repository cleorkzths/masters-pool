"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { buildLeaderboard, formatToPar } from "@/lib/scoring";
import ToParBadge from "@/components/shared/ToParBadge";
import PlayerAvatar from "@/components/shared/PlayerAvatar";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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
  headshot: string | null;
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
  const [activeTab, setActiveTab] = useState<"standings" | "field" | "picks" | "chart">("standings");
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

  // ── Cut status map (player_id → true=active, false=cut/WD) ────────────────

  const playerCutMap = useMemo(() => {
    const map = new Map<string, boolean>();
    if (!espnData?.players?.length) return map;
    for (const ep of espnData.players) {
      const id = nameToId.get(normalizeName(ep.name));
      if (id) map.set(id, !ep.wd);
    }
    return map;
  }, [espnData, nameToId]);

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
        return { ...ep, country: db?.country ?? "", photo_url: db?.photo_url ?? ep.headshot ?? null };
      })
      .sort((a, b) => {
        if (a.wd !== b.wd) return a.wd ? 1 : -1;
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
            "px-3 sm:px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
            activeTab === "standings"
              ? "border-masters-green text-masters-green"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          <span className="sm:hidden">Standings</span>
          <span className="hidden sm:inline">Pool Standings</span>
        </button>
        <button
          onClick={() => setActiveTab("field")}
          className={cn(
            "px-3 sm:px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
            activeTab === "field"
              ? "border-masters-green text-masters-green"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          <span className="sm:hidden">Field</span>
          <span className="hidden sm:inline">Field Scores</span>
        </button>
        <button
          onClick={() => setActiveTab("picks")}
          className={cn(
            "px-3 sm:px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
            activeTab === "picks"
              ? "border-masters-green text-masters-green"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          <span className="sm:hidden">Picks</span>
          <span className="hidden sm:inline">Pick Summary</span>
        </button>
        <button
          onClick={() => setActiveTab("chart")}
          className={cn(
            "px-3 sm:px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
            activeTab === "chart"
              ? "border-masters-green text-masters-green"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          Chart
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
          playerCutMap={playerCutMap}
        />
      )}

      {activeTab === "field" && (
        <FieldTab
          players={fieldPlayers}
          liveActiveRounds={liveActiveRounds}
          loading={!espnData && !espnError}
        />
      )}

      {activeTab === "picks" && (
        <PickSummaryTab entries={entries} totalEntries={entries.length} />
      )}

      {activeTab === "chart" && (
        <WormChart leaderboard={leaderboard} liveActiveRounds={liveActiveRounds} />
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
  playerCutMap,
}: {
  leaderboard: LeaderboardEntry[];
  liveActiveRounds: number[];
  poolId: string;
  myEntryId?: string;
  expandedId: string | null;
  onToggle: (id: string) => void;
  playerCutMap: Map<string, boolean>;
}) {
  if (leaderboard.length === 0) return null;

  const hasScores = liveActiveRounds.length > 0;
  const showCutInfo = playerCutMap.size > 0 && [...playerCutMap.values()].some((v) => !v);

  const gridCols = showCutInfo
    ? "grid-cols-[3rem_1fr_auto] sm:grid-cols-[3rem_1fr_5rem_6rem_6rem]"
    : "grid-cols-[3rem_1fr_auto] sm:grid-cols-[3rem_1fr_6rem_6rem]";

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      {/* Header row */}
      <div className={cn("grid px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide", gridCols)}>
        <div>Pos</div>
        <div>Name</div>
        {showCutInfo && <div className="hidden sm:block text-right">Cut</div>}
        <div className="hidden sm:block text-right">Rounds</div>
        <div className="text-right">Score</div>
      </div>

      {leaderboard.map((entry, idx) => {
        const isMe = entry.entry_id === myEntryId;
        const isExpanded = expandedId === entry.entry_id;
        const pos = positionLabel(entry.position, idx, leaderboard);
        const madeCut = showCutInfo
          ? entry.picks.filter((p) => playerCutMap.get(p.player_id) !== false).length
          : null;

        return (
          <div key={entry.entry_id}>
            {/* Main row — click to expand */}
            <button
              onClick={() => onToggle(entry.entry_id)}
              className={cn(
                "w-full grid px-4 py-3.5 border-b border-gray-50 transition-colors text-left",
                gridCols,
                isMe ? "bg-yellow-50 hover:bg-yellow-100" : "hover:bg-gray-50",
                isExpanded && "border-b-0"
              )}
            >
              <div className="flex items-center">
                {idx === 0 ? (
                  <span className="text-lg leading-none">🥇</span>
                ) : idx === 1 ? (
                  <span className="text-lg leading-none">🥈</span>
                ) : idx === 2 ? (
                  <span className="text-lg leading-none">🥉</span>
                ) : (
                  <span className="text-sm font-bold text-gray-400">{pos}</span>
                )}
              </div>

              <div className="flex flex-col justify-center min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                <span className={cn("font-medium text-gray-900 truncate", isMe && "font-bold")}>
                  {entry.display_name}
                </span>
                {isMe && (
                  <span className="text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                    You
                  </span>
                )}
                <span className="ml-1 text-gray-400 shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </span>
                </div>
                {showCutInfo && (
                  <span className="sm:hidden text-xs text-gray-400 mt-0.5">
                    {madeCut}/{entry.picks.length} made cut
                  </span>
                )}
              </div>

              {showCutInfo && (
                <div className="hidden sm:flex items-center justify-end">
                  <span className="text-sm text-gray-400">
                    {madeCut}/{entry.picks.length}
                  </span>
                </div>
              )}

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

// ── Worm Chart Tab ────────────────────────────────────────────────────────────

const WORM_COLORS = ["#1a7a4a", "#c62828", "#1565c0", "#e65100", "#6a1b9a"];

function WormChart({
  leaderboard,
  liveActiveRounds,
}: {
  leaderboard: LeaderboardEntry[];
  liveActiveRounds: number[];
}) {
  if (liveActiveRounds.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-16 text-gray-400">
        <div className="text-5xl mb-4">📈</div>
        <p>Chart will appear once the tournament begins.</p>
      </div>
    );
  }

  const top5 = leaderboard.slice(0, 5);

  // Format a decimal to-par value, e.g. -5.5 → "-5.5", 0 → "E", +2.0 → "+2.0"
  const fmtAvg = (v: number) => {
    if (v === 0) return "E";
    const s = v.toFixed(1);
    return v > 0 ? `+${s}` : s;
  };

  // Build data points: one per completed round, Y = running avg score per round
  const chartData = liveActiveRounds.map((roundId, idx) => {
    const roundsPlayed = idx + 1;
    const point: Record<string, string | number> = { label: `R${roundId}` };
    for (const entry of top5) {
      let total = 0;
      for (let i = 0; i <= idx; i++) {
        const rr = entry.round_results.find((r) => r.round_id === liveActiveRounds[i]);
        total += rr?.round_total ?? 0;
      }
      point[entry.display_name] = parseFloat((total / roundsPlayed).toFixed(2));
    }
    return point;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-700">Team Score Progression</h3>
        <span className="text-xs text-gray-400">Top 5 teams · avg score per round</span>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={false}
          />
          <YAxis
            reversed
            tickFormatter={(v) => fmtAvg(v)}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            formatter={(value, name) => [
              typeof value === "number" ? fmtAvg(value) : "—",
              name as string,
            ]}
            contentStyle={{
              borderRadius: "0.5rem",
              border: "1px solid #e5e7eb",
              fontSize: "0.75rem",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "0.75rem", paddingTop: "0.75rem" }}
            formatter={(value, entry) => (
              <span style={{ color: entry.color }}>{value}</span>
            )}
          />
          {top5.map((entry, idx) => (
            <Line
              key={entry.entry_id}
              type="linear"
              dataKey={entry.display_name}
              stroke={WORM_COLORS[idx]}
              strokeWidth={idx === 0 ? 2.5 : 1.75}
              dot={{ r: 4, strokeWidth: 0, fill: WORM_COLORS[idx] }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Pick Summary Tab ──────────────────────────────────────────────────────────

function PickSummaryTab({
  entries,
  totalEntries,
}: {
  entries: EntryWithPicks[];
  totalEntries: number;
}) {
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  const pickCounts = useMemo(() => {
    const counts = new Map<string, { name: string; count: number; pickers: string[] }>();
    for (const entry of entries) {
      for (const pick of entry.picks) {
        const existing = counts.get(pick.player_id);
        if (existing) {
          existing.count++;
          existing.pickers.push(entry.display_name);
        } else {
          counts.set(pick.player_id, { name: pick.full_name, count: 1, pickers: [entry.display_name] });
        }
      }
    }
    return [...counts.values()].sort((a, b) => b.count - a.count);
  }, [entries]);

  const maxCount = pickCounts[0]?.count ?? 1;

  if (totalEntries === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-5xl mb-4">⛳</div>
        <p>No entries yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Player
        </span>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Picked by
        </span>
      </div>
      <div className="divide-y divide-gray-50">
        {pickCounts.map(({ name, count, pickers }, idx) => {
          const pct = Math.round((count / totalEntries) * 100);
          const barWidth = Math.round((count / maxCount) * 100);
          const isExpanded = expandedPlayer === name;
          return (
            <div key={name}>
              <button
                onClick={() => setExpandedPlayer(isExpanded ? null : name)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50",
                  idx % 2 === 1 && !isExpanded && "bg-gray-50/30"
                )}
              >
                {/* Rank */}
                <span className="w-5 text-xs font-medium text-gray-400 shrink-0">{idx + 1}</span>

                {/* Name + bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">{name}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
                    )}
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-masters-green transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>

                {/* Count + pct */}
                <div className="shrink-0 text-right">
                  <span className="text-sm font-semibold text-gray-800">{count}</span>
                  <span className="text-xs text-gray-400 ml-1">({pct}%)</span>
                </div>
              </button>

              {/* Expanded pickers list */}
              {isExpanded && (
                <div className="px-4 pb-3 pt-1 bg-gray-50 border-t border-gray-100">
                  <div className="flex flex-wrap gap-1.5 pl-8">
                    {pickers.map((picker) => (
                      <span
                        key={picker}
                        className="px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700"
                      >
                        {picker}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
        {totalEntries} {totalEntries === 1 ? "entry" : "entries"} · {pickCounts.length} unique players picked
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
  players: (EspnPlayer & { country: string; photo_url: string | null })[] | null;
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

      {players.map((player, idx) => {
        const firstCutIdx = players.findIndex((p) => p.wd);
        const showCutLine = firstCutIdx !== -1 && idx === firstCutIdx;
        return (
        <div key={player.name}>
          {showCutLine && (
            <div className={cn("grid items-center px-4 py-2 bg-gray-100 border-y border-gray-200", gridClass)}>
              <div />
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide col-span-1">
                — Missed Cut —
              </div>
              {liveActiveRounds.map((_, i) => <div key={i} />)}
              <div />
            </div>
          )}
          <div
            className={cn(
              "grid items-center px-4 py-3 border-b border-gray-50",
              gridClass,
              player.wd ? "opacity-50" : idx % 2 === 1 ? "bg-gray-50/30" : ""
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

          {/* Avatar + name + country */}
          <div className="flex items-center gap-2 min-w-0">
            <PlayerAvatar name={player.name} photoUrl={player.photo_url} size={32} />
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{player.name}</div>
              {player.country && (
                <div className="text-xs text-gray-400">{player.country}</div>
              )}
            </div>
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
        </div>
        );
      })}
    </div>
  );
}
