-- Seed rounds for 2025 Masters (April 10-13, 2025)
insert into rounds (id, label, round_date, is_complete) values
  (1, 'Round 1', '2025-04-10', false),
  (2, 'Round 2', '2025-04-11', false),
  (3, 'Round 3', '2025-04-12', false),
  (4, 'Round 4', '2025-04-13', false)
on conflict (id) do nothing;

-- Seed 2025 pool (pick deadline = tournament start)
-- Update pick_deadline and created_by after setup
insert into pools (name, year, pick_deadline, max_picks, scoring_keep)
values (
  'Masters Pool 2025',
  2025,
  '2025-04-10 12:00:00+00',
  6,
  4
)
on conflict do nothing;
