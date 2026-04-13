"use client";

import { useState } from "react";

interface Pool {
  id: string;
  name: string;
  year: number;
}

const TOURNAMENTS = ["Masters", "PGA Championship", "US Open", "The Open Championship"];

export default function ArchivePanel({ pools }: { pools: Pool[] }) {
  const [poolId, setPoolId] = useState(pools[0]?.id ?? "");
  const [tournament, setTournament] = useState(TOURNAMENTS[0]);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleArchive() {
    setStatus("saving");
    setMessage("");
    try {
      const res = await fetch("/api/admin/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poolId, tournament }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      setStatus("done");
      setMessage(`Archived ${data.entries} entries successfully.`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="text-2xl mb-2">🏆</div>
      <div className="font-semibold text-gray-900 mb-1">Archive Results</div>
      <div className="text-sm text-gray-500 mb-4">
        Save a permanent snapshot of final standings to the history page.
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Pool</label>
          <select
            value={poolId}
            onChange={(e) => setPoolId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-masters-green"
          >
            {pools.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Tournament</label>
          <select
            value={tournament}
            onChange={(e) => setTournament(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-masters-green"
          >
            {TOURNAMENTS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleArchive}
          disabled={status === "saving" || !poolId}
          className="w-full py-2 bg-masters-green text-white text-sm font-semibold rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "saving" ? "Saving…" : "Archive Final Results"}
        </button>

        {message && (
          <p className={`text-xs ${status === "done" ? "text-green-600" : "text-red-500"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
