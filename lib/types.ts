export interface Player {
  id: string;
  full_name: string;
  country: string;
  world_ranking: number | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Round {
  id: number;
  label: string;
  round_date: string;
  is_complete: boolean;
}

export interface Score {
  id: string;
  player_id: string;
  round_id: number;
  strokes: number | null;
  to_par: number | null;
}

export interface Pool {
  id: string;
  name: string;
  year: number;
  pick_deadline: string;
  max_picks: number;
  scoring_keep: number;
  created_by: string;
  created_at: string;
}

export interface Entry {
  id: string;
  pool_id: string;
  user_id: string;
  display_name: string;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface EntryPick {
  id: string;
  entry_id: string;
  player_id: string;
  pick_slot: number;
}

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  is_admin: boolean;
}

// Enriched types for UI
export interface PlayerWithScore extends Player {
  scores: Record<number, Score>; // round_id -> Score
  total_to_par: number | null;
  rounds_played: number;
}

export interface EntryRoundResult {
  round_id: number;
  scores_used: (number | null)[];
  scores_dropped: (number | null)[];
  round_total: number | null;
  player_details: {
    player_id: string;
    full_name: string;
    to_par: number | null;
    is_dropped: boolean;
  }[];
}

export interface LeaderboardEntry {
  entry_id: string;
  display_name: string;
  user_id: string;
  pool_id: string;
  total_to_par: number;
  rounds_played: number;
  position: number;
  picks?: PlayerWithScore[];
}

export interface EntryDetail extends Entry {
  picks: Array<{
    pick_slot: number;
    player: PlayerWithScore;
  }>;
  round_results: EntryRoundResult[];
  total_to_par: number;
}
