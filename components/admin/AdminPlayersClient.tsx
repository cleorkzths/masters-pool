"use client";

import { useState, useRef } from "react";
import PlayerAvatar from "@/components/shared/PlayerAvatar";
import type { Player } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

interface AdminPlayersClientProps {
  players: Player[];
}

export default function AdminPlayersClient({ players: initialPlayers }: AdminPlayersClientProps) {
  const [players, setPlayers] = useState(initialPlayers);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);

  const supabase = createClient();

  const filtered = players.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase())
  );

  async function handlePhotoUpload(playerId: string, file: File) {
    setUploading(playerId);

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `players/${playerId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("player-photos")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      alert("Upload failed: " + uploadError.message);
      setUploading(null);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("player-photos")
      .getPublicUrl(path);

    await supabase
      .from("players")
      .update({ photo_url: publicUrl })
      .eq("id", playerId);

    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, photo_url: publicUrl } : p))
    );
    setUploading(null);
  }

  async function toggleActive(playerId: string, currentValue: boolean) {
    setToggling(playerId);
    await supabase
      .from("players")
      .update({ is_active: !currentValue })
      .eq("id", playerId);
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === playerId ? { ...p, is_active: !currentValue } : p
      )
    );
    setToggling(null);
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="search"
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-masters-green text-sm"
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadTarget) {
            handlePhotoUpload(uploadTarget, file);
          }
          e.target.value = "";
        }}
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <div>Photo</div>
          <div>Player</div>
          <div className="text-center">Active</div>
          <div>Actions</div>
        </div>

        {filtered.map((player) => (
          <div
            key={player.id}
            className="grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center px-4 py-3 border-b border-gray-50 hover:bg-gray-50"
          >
            <PlayerAvatar name={player.full_name} photoUrl={player.photo_url} size={40} />

            <div>
              <div className="font-medium text-sm text-gray-900">{player.full_name}</div>
              <div className="text-xs text-gray-400">
                {player.country}
                {player.world_ranking && player.world_ranking < 500
                  ? ` · #${player.world_ranking}`
                  : ""}
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => toggleActive(player.id, player.is_active)}
                disabled={toggling === player.id}
                className={`w-10 h-6 rounded-full transition-colors ${
                  player.is_active ? "bg-masters-green" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white mx-auto transition-transform ${
                    player.is_active ? "translate-x-2" : "-translate-x-2"
                  }`}
                />
              </button>
            </div>

            <button
              onClick={() => {
                setUploadTarget(player.id);
                fileInputRef.current?.click();
              }}
              disabled={uploading === player.id}
              className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              {uploading === player.id ? "Uploading..." : "Upload Photo"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
