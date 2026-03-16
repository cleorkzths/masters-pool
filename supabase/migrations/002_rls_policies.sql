-- Row Level Security Policies

-- Helper function to check admin status WITHOUT triggering RLS recursion
-- SECURITY DEFINER bypasses RLS when querying profiles
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and is_admin = true
  );
$$;

-- Players: public read, admin write
alter table players enable row level security;
create policy "players_public_read" on players for select using (true);
create policy "players_admin_write" on players for all using (is_admin());

-- Rounds: public read, admin write
alter table rounds enable row level security;
create policy "rounds_public_read" on rounds for select using (true);
create policy "rounds_admin_write" on rounds for all using (is_admin());

-- Scores: public read, admin write
alter table scores enable row level security;
create policy "scores_public_read" on scores for select using (true);
create policy "scores_admin_write" on scores for all using (is_admin());

-- Pools: public read, admin write
alter table pools enable row level security;
create policy "pools_public_read" on pools for select using (true);
create policy "pools_admin_write" on pools for all using (is_admin());

-- Profiles: simple policies, NO self-referencing
alter table profiles enable row level security;
create policy "profiles_read_own" on profiles for select using (id = auth.uid());
create policy "profiles_update_own" on profiles for update using (id = auth.uid());
-- Admins can read all profiles (uses the safe function, not a subquery on profiles)
create policy "profiles_admin_read" on profiles for select using (is_admin());

-- Entries: public read (for leaderboard), users write own
alter table entries enable row level security;
create policy "entries_public_read" on entries for select using (true);
create policy "entries_insert_own" on entries for insert with check (user_id = auth.uid());
create policy "entries_update_own" on entries for update
  using (
    user_id = auth.uid() and
    exists (
      select 1 from pools
      where id = pool_id and pick_deadline > now()
    )
  );
create policy "entries_admin_all" on entries for all using (is_admin());

-- Entry picks: public read, users write own (before deadline)
alter table entry_picks enable row level security;
create policy "entry_picks_public_read" on entry_picks for select using (true);
create policy "entry_picks_write_own" on entry_picks for all
  using (
    exists (
      select 1 from entries e
      join pools p on p.id = e.pool_id
      where e.id = entry_id
        and e.user_id = auth.uid()
        and p.pick_deadline > now()
    )
  );
create policy "entry_picks_admin_all" on entry_picks for all using (is_admin());
