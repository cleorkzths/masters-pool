export const dynamic = 'force-dynamic';

/**
 * ESPN golf API returns:
 * - score.displayValue: total to-par as string ("E", "-3", "+2", "-" for not started)
 * - linescores[i].displayValue: per-round to-par as string (same format)
 * - score.value / linescores[i].value: ESPN-internal numbers — NOT to-par, do not use
 */

function parseToParDisplay(displayValue: unknown): number | null {
  if (displayValue === null || displayValue === undefined) return null;
  const s = String(displayValue).trim();
  if (!s || s === '-' || s === '--') return null;
  if (s.toUpperCase() === 'E') return 0;
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isWdOrCut(comp: any): boolean {
  const statusName: string = comp.status?.type?.name ?? '';
  const posDisplay: string = comp.status?.position?.displayName ?? '';
  return (
    ['WD', 'MC', 'CUT', 'DQ', 'MDF'].includes(posDisplay) ||
    statusName.includes('WD') ||
    statusName.includes('DISQUALIFIED') ||
    statusName.includes('CUT')
  );
}

export async function GET() {
  try {
    const res = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/golf/leaderboard?league=pga',
      {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      }
    );

    if (!res.ok) {
      return Response.json({ players: [], eventName: null });
    }

    const data = await res.json();
    const event = data?.events?.[0];
    if (!event) {
      return Response.json({ players: [], eventName: null });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const competitors: any[] = event.competitions?.[0]?.competitors ?? [];

    const players = competitors.map((comp) => {
      const name: string = comp.athlete?.displayName ?? '';
      const wd = isWdOrCut(comp);

      // Total to-par: use displayValue ("E", "-3", "+2", "-")
      const toPar = parseToParDisplay(comp.score?.displayValue);

      const position: string = comp.status?.position?.displayName ?? '';
      const statusName: string = comp.status?.type?.name ?? '';

      // Per-round to-par from linescores — use displayValue, NOT value
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const linescores: any[] = comp.linescores ?? [];
      const rounds: (number | null)[] = linescores.map((ls) =>
        parseToParDisplay(ls?.displayValue)
      );
      // Pad to 4 rounds
      while (rounds.length < 4) rounds.push(null);

      return { name, toPar, position, status: statusName, rounds, wd };
    });

    return Response.json({
      players,
      eventName: event.name,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error('ESPN fetch error:', err);
    return Response.json({ players: [], eventName: null });
  }
}
