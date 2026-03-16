-- Masters Pool Schema

-- Players table
create table if not exists players (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null,
  country      text not null default 'USA',
  world_ranking integer,
  photo_url    text,
  is_active    boolean default true,
  created_at   timestamptz default now()
);

-- Rounds table (1-4)
create table if not exists rounds (
  id           integer primary key,
  label        text not null,
  round_date   date not null,
  is_complete  boolean default false,
  created_at   timestamptz default now()
);

-- Scores per player per round
create table if not exists scores (
  id           uuid primary key default gen_random_uuid(),
  player_id    uuid references players(id) on delete cascade,
  round_id     integer references rounds(id),
  strokes      integer,
  to_par       integer,
  created_at   timestamptz default now(),
  unique (player_id, round_id)
);

-- Pool (one per year typically)
create table if not exists pools (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  year          integer not null default 2025,
  pick_deadline timestamptz not null,
  max_picks     integer default 6,
  scoring_keep  integer default 4,
  created_by    uuid references auth.users(id),
  created_at    timestamptz default now()
);

-- User profiles (extends auth.users)
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique,
  avatar_url   text,
  is_admin     boolean default false,
  created_at   timestamptz default now()
);

-- Entries (one per user per pool)
create table if not exists entries (
  id           uuid primary key default gen_random_uuid(),
  pool_id      uuid references pools(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete cascade,
  display_name text not null,
  is_paid      boolean default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (pool_id, user_id)
);

-- The 6 picks per entry
create table if not exists entry_picks (
  id           uuid primary key default gen_random_uuid(),
  entry_id     uuid references entries(id) on delete cascade,
  player_id    uuid references players(id),
  pick_slot    integer not null check (pick_slot between 1 and 6),
  created_at   timestamptz default now(),
  unique (entry_id, pick_slot),
  unique (entry_id, player_id)
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
