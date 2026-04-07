import Link from "next/link";
import type { Pool } from "@/lib/types";

interface HeaderProps {
  pool: Pool;
  poolId: string;
}

export default function Header({ pool, poolId }: HeaderProps) {
  return (
    <header className="masters-header text-white shadow-lg">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href={`/pool/${poolId}`} className="flex items-center gap-3">
          <span className="text-2xl">⛳</span>
          <div>
            <div className="font-bold text-lg leading-tight">{pool.name}</div>
            <div className="text-xs text-green-200">Masters Pool {pool.year}</div>
          </div>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href={`/pool/${poolId}`}
            className="text-sm text-green-100 hover:text-white transition-colors hidden sm:block"
          >
            Leaderboard
          </Link>
          <Link
            href={`/pool/${poolId}/players`}
            className="text-sm text-green-100 hover:text-white transition-colors hidden sm:block"
          >
            Field
          </Link>
          <Link
            href={`/pool/${poolId}/find`}
            className="text-sm text-green-100 hover:text-white transition-colors hidden sm:block"
          >
            Find my picks
          </Link>
          <Link
            href={`/pool/${poolId}/about`}
            className="text-sm text-green-100 hover:text-white transition-colors hidden sm:block"
          >
            About
          </Link>
          <Link
            href={`/pool/${poolId}/pick`}
            className="text-sm px-4 py-1.5 bg-masters-yellow text-gray-900 font-semibold rounded-lg hover:bg-yellow-300 transition-colors"
          >
            Make My Picks
          </Link>
        </nav>
      </div>
    </header>
  );
}
