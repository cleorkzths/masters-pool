import { formatToPar } from "@/lib/scoring";
import { cn } from "@/lib/utils";

interface ToParBadgeProps {
  toPar: number | null;
  className?: string;
  large?: boolean;
}

export default function ToParBadge({ toPar, className, large }: ToParBadgeProps) {
  const text = formatToPar(toPar);
  const color =
    toPar === null
      ? "text-gray-400"
      : toPar < 0
      ? "text-red-600"
      : toPar === 0
      ? "text-gray-700"
      : "text-gray-500";

  return (
    <span
      className={cn(
        "font-mono font-semibold tabular-nums",
        large ? "text-3xl" : "text-sm",
        color,
        className
      )}
    >
      {text}
    </span>
  );
}
