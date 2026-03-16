-- Remove auth requirement from entries
ALTER TABLE entries ADD COLUMN IF NOT EXISTS token uuid DEFAULT gen_random_uuid();
ALTER TABLE entries ALTER COLUMN user_id DROP NOT NULL;

-- Drop old auth-based entry policies
DROP POLICY IF EXISTS "entries_insert_own" ON entries;
DROP POLICY IF EXISTS "entries_update_own" ON entries;
DROP POLICY IF EXISTS "entry_picks_write_own" ON entry_picks;

-- Anyone can insert an entry (no login needed)
CREATE POLICY "entries_insert_anon" ON entries
  FOR INSERT WITH CHECK (true);

-- Anyone with the matching token can update their entry (before deadline)
CREATE POLICY "entries_update_token" ON entries
  FOR UPDATE USING (
    token = current_setting('request.cookies', true)::json->>(
      'entry_token_' || pool_id::text
    )::uuid::text
    OR is_admin()
  );

-- Entry picks: anyone can insert for an entry that exists
CREATE POLICY "entry_picks_insert_anon" ON entry_picks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM entries WHERE id = entry_id)
  );

-- Entry picks: token-based delete for editing
CREATE POLICY "entry_picks_delete_token" ON entry_picks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM entries e
      JOIN pools p ON p.id = e.pool_id
      WHERE e.id = entry_id
        AND p.pick_deadline > now()
    )
    OR is_admin()
  );
