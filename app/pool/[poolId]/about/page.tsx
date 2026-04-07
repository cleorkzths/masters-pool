import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ poolId: string }>;
}) {
  const { poolId } = await params;
  const supabase = await createClient();

  const { data: pool } = await supabase
    .from("pools")
    .select("*")
    .eq("id", poolId)
    .single();

  if (!pool) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">About the Pool</h1>
        <p className="text-gray-500 text-sm">Masters Pool {pool.year} · How it works</p>
      </div>

      {/* How to play */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 text-lg mb-4">How to Play</h2>
        <ol className="space-y-3 text-sm text-gray-600 list-decimal list-inside">
          <li>
            Pick <strong className="text-gray-800">{pool.max_picks} players</strong> from the Masters field before the
            tournament begins.
          </li>
          <li>
            You have a <strong className="text-gray-800">${pool.salary_cap.toLocaleString()} salary cap</strong> — each
            player has a price based on their odds. Spend it wisely.
          </li>
          <li>
            Each round, your <strong className="text-gray-800">best {pool.scoring_keep}</strong> of your {pool.max_picks}{" "}
            players count. The worst {pool.max_picks - pool.scoring_keep} are dropped automatically.
          </li>
          <li>
            Your score is the <strong className="text-gray-800">sum of to-par</strong> across your best{" "}
            {pool.scoring_keep} players for each round. Lower is better.
          </li>
          <li>
            If a player withdraws or misses the cut, they score <strong className="text-gray-800">+99</strong> for
            remaining rounds — effectively always dropped.
          </li>
        </ol>
      </section>

      {/* Scoring example */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 text-lg mb-4">Scoring Example</h2>
        <p className="text-sm text-gray-600 mb-3">
          Say you pick 6 players and after Round 1 their scores are:
        </p>
        <div className="space-y-1.5 text-sm font-mono mb-3">
          {[
            ["Player A", "-4", false],
            ["Player B", "-3", false],
            ["Player C", "-2", false],
            ["Player D", "+1", false],
            ["Player E", "+3", true],
            ["Player F", "+5", true],
          ].map(([name, score, dropped]) => (
            <div key={name as string} className={`flex justify-between px-3 py-1 rounded ${dropped ? "bg-gray-50 text-gray-400 line-through" : "bg-green-50 text-gray-800"}`}>
              <span>{name as string}</span>
              <span>{score as string}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600">
          Your Round 1 score = <strong>-4 + -3 + -2 + +1 = <span className="text-masters-green">-8</span></strong>.
          Players E and F are dropped (worst 2).
        </p>
      </section>

      {/* Salary cap */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 text-lg mb-4">Salary Cap & Pricing</h2>
        <p className="text-sm text-gray-600 mb-2">
          Player prices are set based on pre-tournament Vegas win odds — the better the expected
          performance, the higher the price. The salary cap forces you to mix stars with longer
          shots rather than loading up on favorites.
        </p>
        <p className="text-sm text-gray-600">
          You can edit your picks any time before the deadline. After the tournament starts, picks
          are locked.
        </p>
      </section>

      {/* Data sources */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 text-lg mb-4">Data Sources</h2>
        <ul className="space-y-3 text-sm text-gray-600">
          <li>
            <span className="font-medium text-gray-800">Player field — </span>
            Sourced from the{" "}
            <a
              href="https://www.masters.com/en_US/players/field.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-masters-green underline hover:text-green-800"
            >
              official Masters.com field
            </a>{" "}
            and{" "}
            <a
              href="https://www.espn.com/golf/tournament/field/_/id/2025"
              target="_blank"
              rel="noopener noreferrer"
              className="text-masters-green underline hover:text-green-800"
            >
              ESPN Golf
            </a>
            .
          </li>
          <li>
            <span className="font-medium text-gray-800">Scores — </span>
            Entered manually during the tournament via the admin panel, referenced against{" "}
            <a
              href="https://www.masters.com/en_US/scores/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-masters-green underline hover:text-green-800"
            >
              Masters.com live scoring
            </a>
            .
          </li>
          <li>
            <span className="font-medium text-gray-800">World rankings — </span>
            Based on the{" "}
            <a
              href="https://www.owgr.com/ranking"
              target="_blank"
              rel="noopener noreferrer"
              className="text-masters-green underline hover:text-green-800"
            >
              Official World Golf Ranking (OWGR)
            </a>{" "}
            as of the week of the tournament.
          </li>
          <li>
            <span className="font-medium text-gray-800">Player prices — </span>
            Derived from pre-tournament win odds at major US sportsbooks (DraftKings, FanDuel),
            scaled to fit the ${pool.salary_cap.toLocaleString()} salary cap.
          </li>
        </ul>
      </section>

      {/* Footer note */}
      <p className="text-xs text-gray-400 text-center pb-4">
        This is a private pool for friends. Not affiliated with Augusta National or the Masters Tournament.
      </p>
    </div>
  );
}
