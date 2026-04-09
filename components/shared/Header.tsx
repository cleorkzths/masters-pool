"use client";

import Link from "next/link";
import { useState } from "react";
import type { Pool } from "@/lib/types";
import { isDeadlinePassed } from "@/lib/utils";

interface HeaderProps {
  pool: Pool;
  poolId: string;
}

export default function Header({ pool, poolId }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const picksClosed = isDeadlinePassed(pool.pick_deadline);

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

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-4">
          <Link href={`/pool/${poolId}`} className="text-sm text-green-100 hover:text-white transition-colors">
            Leaderboard
          </Link>
          <Link href={`/pool/${poolId}/players`} className="text-sm text-green-100 hover:text-white transition-colors">
            Field
          </Link>
          <Link href={`/pool/${poolId}/find`} className="text-sm text-green-100 hover:text-white transition-colors">
            Find my picks
          </Link>
          <Link href={`/pool/${poolId}/about`} className="text-sm text-green-100 hover:text-white transition-colors">
            About
          </Link>
          {picksClosed ? (
            <span className="text-sm px-4 py-1.5 bg-gray-200 text-gray-400 font-semibold rounded-lg cursor-not-allowed select-none">
              🔒 Picks Locked
            </span>
          ) : (
            <Link href={`/pool/${poolId}/pick`} className="text-sm px-4 py-1.5 bg-masters-yellow text-gray-900 font-semibold rounded-lg hover:bg-yellow-300 transition-colors">
              Make My Picks
            </Link>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden text-white focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden px-4 pb-4 flex flex-col gap-3">
          <Link href={`/pool/${poolId}`} className="text-sm text-green-100 hover:text-white transition-colors" onClick={() => setMenuOpen(false)}>
            Leaderboard
          </Link>
          <Link href={`/pool/${poolId}/players`} className="text-sm text-green-100 hover:text-white transition-colors" onClick={() => setMenuOpen(false)}>
            Field
          </Link>
          <Link href={`/pool/${poolId}/find`} className="text-sm text-green-100 hover:text-white transition-colors" onClick={() => setMenuOpen(false)}>
            Find my picks
          </Link>
          <Link href={`/pool/${poolId}/about`} className="text-sm text-green-100 hover:text-white transition-colors" onClick={() => setMenuOpen(false)}>
            About
          </Link>
          {picksClosed ? (
            <span className="text-sm px-4 py-1.5 bg-gray-200 text-gray-400 font-semibold rounded-lg cursor-not-allowed select-none text-center">
              🔒 Picks Locked
            </span>
          ) : (
            <Link href={`/pool/${poolId}/pick`} className="text-sm px-4 py-1.5 bg-masters-yellow text-gray-900 font-semibold rounded-lg hover:bg-yellow-300 transition-colors text-center" onClick={() => setMenuOpen(false)}>
              Make My Picks
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
