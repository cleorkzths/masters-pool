import PlayerAvatar from "@/components/shared/PlayerAvatar";
import type { Player } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PlayerCardProps {
  player: Player;
  isSelected: boolean;
  isFull: boolean;
  isOverBudget: boolean;
  onToggle: () => void;
}

const FLAG_MAP: Record<string, string> = {
  USA: "🇺🇸", ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", ESP: "🇪🇸", NIR: "🇬🇧", SCO: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  IRL: "🇮🇪", AUS: "🇦🇺", NOR: "🇳🇴", SWE: "🇸🇪", JPN: "🇯🇵",
  KOR: "🇰🇷", CAN: "🇨🇦", AUT: "🇦🇹", CHI: "🇨🇱", RSA: "🇿🇦",
  NZL: "🇳🇿", FRA: "🇫🇷", COL: "🇨🇴", GER: "🇩🇪", POL: "🇵🇱",
  TPE: "🇹🇼",
};

export default function PlayerCard({ player, isSelected, isFull, isOverBudget, onToggle }: PlayerCardProps) {
  const flag = FLAG_MAP[player.country] ?? "";
  const disabled = (isFull || isOverBudget) && !isSelected;

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border-2 text-left w-full transition-all",
        isSelected
          ? "border-masters-green bg-green-50 shadow-sm"
          : disabled
          ? "border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed"
          : "border-gray-200 bg-white hover:border-masters-green hover:shadow-sm"
      )}
    >
      <PlayerAvatar name={player.full_name} photoUrl={player.photo_url} size={44} />

      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 text-sm truncate">{player.full_name}</div>
        <div className="text-xs text-gray-400">
          {flag} {player.country}
          {player.world_ranking && player.world_ranking < 500 && (
            <span className="ml-2 text-gray-300">#{player.world_ranking}</span>
          )}
        </div>
      </div>

      {/* Salary */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className={cn(
          "text-sm font-bold",
          isSelected ? "text-masters-green" : "text-gray-700"
        )}>
          ${player.salary}
        </span>

        {isSelected ? (
          <div className="w-5 h-5 rounded-full bg-masters-green flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
        )}
      </div>
    </button>
  );
}
