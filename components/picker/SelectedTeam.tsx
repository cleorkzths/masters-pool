import PlayerAvatar from "@/components/shared/PlayerAvatar";
import type { Player } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SelectedTeamProps {
  players: Player[];
  maxPicks: number;
  salaryCap: number;
  onRemove: (id: string) => void;
  onSave: () => void;
  saving: boolean;
  error: string;
  displayName: string;
}

export default function SelectedTeam({
  players,
  maxPicks,
  salaryCap,
  onRemove,
  onSave,
  saving,
  error,
  displayName,
}: SelectedTeamProps) {
  const slots = Array.from({ length: maxPicks });
  const remaining = maxPicks - players.length;
  const salaryUsed = players.reduce((sum, p) => sum + p.salary, 0);
  const salaryLeft = salaryCap - salaryUsed;
  const isOverBudget = salaryLeft < 0;
  const pct = Math.min(100, (salaryUsed / salaryCap) * 100);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="masters-header px-4 py-3">
        <div className="text-white font-semibold text-sm">Your Team</div>
        <div className="text-green-200 text-xs">
          {players.length}/{maxPicks} players
        </div>
      </div>

      {/* Salary cap bar */}
      <div className="px-3 pt-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500">Salary cap</span>
          <span className={cn("text-xs font-bold tabular-nums", isOverBudget ? "text-red-600" : "text-masters-green")}>
            ${salaryLeft.toLocaleString()} left
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", isOverBudget ? "bg-red-500" : "bg-masters-green")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-xs text-gray-400">${salaryUsed.toLocaleString()} used</span>
          <span className="text-xs text-gray-400">${salaryCap.toLocaleString()} cap</span>
        </div>
      </div>

      <div className="p-3 space-y-1.5">
        {slots.map((_, i) => {
          const player = players[i];
          return (
            <div
              key={i}
              className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 min-h-[3rem]"
            >
              <span className="text-xs text-gray-300 w-4 text-center font-mono">{i + 1}</span>
              {player ? (
                <>
                  <PlayerAvatar name={player.full_name} photoUrl={player.photo_url} size={30} />
                  <span className="flex-1 text-xs font-medium text-gray-800 truncate">{player.full_name}</span>
                  <span className="text-xs font-bold text-gray-500 flex-shrink-0">${player.salary}</span>
                  <button
                    onClick={() => onRemove(player.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </>
              ) : (
                <span className="text-xs text-gray-300 italic">Empty slot</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-3 pb-3">
        {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
        {isOverBudget && (
          <p className="text-xs text-red-600 mb-2">Over budget by ${Math.abs(salaryLeft)}</p>
        )}

        <button
          onClick={onSave}
          disabled={saving || players.length !== maxPicks || !displayName.trim() || isOverBudget}
          className="w-full py-2.5 bg-masters-green text-white font-semibold rounded-lg hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {saving
            ? "Saving..."
            : remaining > 0
            ? `Pick ${remaining} more`
            : isOverBudget
            ? "Over budget"
            : "Save My Team"}
        </button>
      </div>
    </div>
  );
}
