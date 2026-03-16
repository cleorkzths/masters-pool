import PlayerAvatar from "@/components/shared/PlayerAvatar";
import type { Player } from "@/lib/types";

interface SelectedTeamProps {
  players: Player[];
  maxPicks: number;
  onRemove: (id: string) => void;
  onSave: () => void;
  saving: boolean;
  error: string;
  displayName: string;
}

export default function SelectedTeam({
  players,
  maxPicks,
  onRemove,
  onSave,
  saving,
  error,
  displayName,
}: SelectedTeamProps) {
  const slots = Array.from({ length: maxPicks });
  const remaining = maxPicks - players.length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="masters-header px-4 py-3">
        <div className="text-white font-semibold text-sm">Your Team</div>
        <div className="text-green-200 text-xs">
          {players.length}/{maxPicks} selected
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
              <span className="text-xs text-gray-300 w-4 text-center font-mono">
                {i + 1}
              </span>
              {player ? (
                <>
                  <PlayerAvatar name={player.full_name} photoUrl={player.photo_url} size={32} />
                  <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                    {player.full_name}
                  </span>
                  <button
                    onClick={() => onRemove(player.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                    aria-label="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
        {error && (
          <p className="text-xs text-red-600 mb-2">{error}</p>
        )}

        <button
          onClick={onSave}
          disabled={saving || players.length !== maxPicks || !displayName.trim()}
          className="w-full py-2.5 bg-masters-green text-white font-semibold rounded-lg hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {saving
            ? "Saving..."
            : remaining > 0
            ? `Pick ${remaining} more player${remaining > 1 ? "s" : ""}`
            : "Save My Team"}
        </button>
      </div>
    </div>
  );
}
