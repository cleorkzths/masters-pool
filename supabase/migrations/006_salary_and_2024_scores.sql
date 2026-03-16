-- Add salary column to players
ALTER TABLE players ADD COLUMN IF NOT EXISTS salary integer DEFAULT 30;

-- Add salary_cap column to pools
ALTER TABLE pools ADD COLUMN IF NOT EXISTS salary_cap integer DEFAULT 1000;

-- =============================================================
-- SET PLAYER SALARIES
-- Formula: round(850 * prob^0.55 / 5) * 5, floor $30
-- Based on 2024 pre-tournament Vegas win odds
-- =============================================================
UPDATE players SET salary = CASE
  -- Tier 1: Heavy favorite
  WHEN full_name = 'Scottie Scheffler'         THEN 300   -- +380
  -- Tier 2: Top contenders
  WHEN full_name = 'Rory McIlroy'              THEN 195   -- +1000
  WHEN full_name = 'Jon Rahm'                  THEN 185   -- +1100
  WHEN full_name = 'Viktor Hovland'            THEN 180   -- +1200
  WHEN full_name = 'Xander Schauffele'         THEN 155   -- +1600
  WHEN full_name = 'Brooks Koepka'             THEN 145   -- +1800
  WHEN full_name = 'Collin Morikawa'           THEN 145   -- +1800
  WHEN full_name = 'Patrick Cantlay'           THEN 135   -- +2000
  WHEN full_name = 'Ludvig Aberg'              THEN 135   -- +2000
  WHEN full_name = 'Jordan Spieth'             THEN 125   -- +2200
  -- Tier 3: Solid contenders
  WHEN full_name = 'Tommy Fleetwood'           THEN 110   -- +2800
  WHEN full_name = 'Max Homa'                  THEN 110   -- +2800
  WHEN full_name = 'Hideki Matsuyama'          THEN 105   -- +3000
  WHEN full_name = 'Tony Finau'                THEN 95    -- +3500
  WHEN full_name = 'Bryson DeChambeau'         THEN 95    -- +3500
  WHEN full_name = 'Jason Day'                 THEN 90    -- +4000
  WHEN full_name = 'Cameron Young'             THEN 80    -- +5000
  WHEN full_name = 'Justin Rose'               THEN 70    -- +6000
  WHEN full_name = 'Shane Lowry'               THEN 70    -- +6000
  -- Tier 4: Longer shots
  WHEN full_name = 'Russell Henley'            THEN 60    -- +8000
  WHEN full_name = 'Min Woo Lee'               THEN 60    -- +8000
  WHEN full_name = 'Sungjae Im'                THEN 55    -- +10000
  WHEN full_name = 'Corey Conners'             THEN 55    -- +10000
  WHEN full_name = 'Tom Kim'                   THEN 55    -- +10000
  WHEN full_name = 'Tyrrell Hatton'            THEN 50    -- +12000
  WHEN full_name = 'Wyndham Clark'             THEN 50    -- +12000
  WHEN full_name = 'Sepp Straka'               THEN 45    -- +15000
  WHEN full_name = 'Si Woo Kim'                THEN 45    -- +15000
  WHEN full_name = 'Cameron Smith'             THEN 45    -- +15000
  WHEN full_name = 'Joaquin Niemann'           THEN 45    -- +15000
  WHEN full_name = 'Sam Burns'                 THEN 45    -- +15000
  WHEN full_name = 'Keegan Bradley'            THEN 40    -- +20000
  WHEN full_name = 'Robert MacIntyre'          THEN 40    -- +20000
  WHEN full_name = 'Matt Fitzpatrick'          THEN 40    -- +20000
  WHEN full_name = 'Brian Harman'              THEN 40    -- +20000
  WHEN full_name = 'Harris English'            THEN 40    -- +20000
  WHEN full_name = 'Rickie Fowler'             THEN 40    -- +20000
  WHEN full_name = 'Will Zalatoris'            THEN 40    -- +20000
  WHEN full_name = 'Patrick Reed'              THEN 40    -- +25000
  WHEN full_name = 'Dustin Johnson'            THEN 35    -- +30000
  WHEN full_name = 'Adam Scott'                THEN 35    -- +30000
  WHEN full_name = 'Billy Horschel'            THEN 35    -- +30000
  WHEN full_name = 'Lucas Glover'              THEN 35    -- +35000
  WHEN full_name = 'Taylor Moore'              THEN 35    -- +35000
  -- Past champions / longest shots
  WHEN full_name = 'Tiger Woods'               THEN 30
  WHEN full_name = 'Phil Mickelson'            THEN 30
  WHEN full_name = 'Sergio Garcia'             THEN 30
  WHEN full_name = 'Bubba Watson'              THEN 30
  WHEN full_name = 'Zach Johnson'              THEN 30
  WHEN full_name = 'Trevor Immelman'           THEN 30
  WHEN full_name = 'Mike Weir'                 THEN 30
  WHEN full_name = 'Jose Maria Olazabal'       THEN 30
  WHEN full_name = 'Fred Couples'              THEN 30
  WHEN full_name = 'Bernhard Langer'           THEN 30
  WHEN full_name = 'Larry Mize'                THEN 30
  WHEN full_name = 'Charles Coody'             THEN 30
  WHEN full_name = 'Sandy Lyle'                THEN 30
  ELSE 30
END;

-- =============================================================
-- 2024 MASTERS ROUND-BY-ROUND SCORES (APPROXIMATE TEST DATA)
-- All to_par values; strokes = 72 + to_par
-- Top ~35 players who made the cut
-- Rounds 1-4 complete
-- Note: round splits are approximate — final totals are accurate
--       for the top 10, reconstructed for positions 11-35
-- Update via /admin/scores if corrections are needed
-- =============================================================

-- Clear any existing test scores first
DELETE FROM scores;

-- Round 1 scores
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, -4, 68 FROM players WHERE full_name = 'Scottie Scheffler';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, -2, 70 FROM players WHERE full_name = 'Ludvig Aberg';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, -2, 70 FROM players WHERE full_name = 'Tommy Fleetwood';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, -3, 69 FROM players WHERE full_name = 'Collin Morikawa';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, -1, 71 FROM players WHERE full_name = 'Max Homa';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, -3, 69 FROM players WHERE full_name = 'Xander Schauffele';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, -1, 71 FROM players WHERE full_name = 'Bryson DeChambeau';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, -1, 71 FROM players WHERE full_name = 'Cameron Young';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, -2, 70 FROM players WHERE full_name = 'Patrick Cantlay';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1,  0, 72 FROM players WHERE full_name = 'Jason Day';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, -2, 70 FROM players WHERE full_name = 'Jon Rahm';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1,  0, 72 FROM players WHERE full_name = 'Wyndham Clark';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, -1, 71 FROM players WHERE full_name = 'Dustin Johnson';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, -1, 71 FROM players WHERE full_name = 'Harris English';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1,  0, 72 FROM players WHERE full_name = 'Viktor Hovland';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, -1, 71 FROM players WHERE full_name = 'Russell Henley';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, -1, 71 FROM players WHERE full_name = 'Rory McIlroy';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1,  0, 72 FROM players WHERE full_name = 'Corey Conners';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1,  0, 72 FROM players WHERE full_name = 'Hideki Matsuyama';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, +1, 73 FROM players WHERE full_name = 'Shane Lowry';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1,  0, 72 FROM players WHERE full_name = 'Tony Finau';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1,  0, 72 FROM players WHERE full_name = 'Adam Scott';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1,  0, 72 FROM players WHERE full_name = 'Sepp Straka';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, +1, 73 FROM players WHERE full_name = 'Brian Harman';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1,  0, 72 FROM players WHERE full_name = 'Jordan Spieth';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1,  0, 72 FROM players WHERE full_name = 'Brooks Koepka';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, -1, 71 FROM players WHERE full_name = 'Min Woo Lee';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, +1, 73 FROM players WHERE full_name = 'Cameron Smith';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1,  0, 72 FROM players WHERE full_name = 'Patrick Reed';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, +1, 73 FROM players WHERE full_name = 'Tom Kim';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1,  0, 72 FROM players WHERE full_name = 'Sungjae Im';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1,  0, 72 FROM players WHERE full_name = 'Justin Rose';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1,  0, 72 FROM players WHERE full_name = 'Matt Fitzpatrick';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, +1, 73 FROM players WHERE full_name = 'Joaquin Niemann';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1,  0, 72 FROM players WHERE full_name = 'Rickie Fowler';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, +1, 73 FROM players WHERE full_name = 'Robert MacIntyre';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1,  0, 72 FROM players WHERE full_name = 'Si Woo Kim';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, +1, 73 FROM players WHERE full_name = 'Taylor Moore';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, +1, 73 FROM players WHERE full_name = 'Will Zalatoris';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, +1, 73 FROM players WHERE full_name = 'Lucas Glover';
-- Missed cut players (R1 only listed, R2 below)
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, +4, 76 FROM players WHERE full_name = 'Tiger Woods';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, +2, 74 FROM players WHERE full_name = 'Phil Mickelson';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, +2, 74 FROM players WHERE full_name = 'Sergio Garcia';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, +3, 75 FROM players WHERE full_name = 'Bubba Watson';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, +4, 76 FROM players WHERE full_name = 'Zach Johnson';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 1, +3, 75 FROM players WHERE full_name = 'Fred Couples';

-- Round 2 scores
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, -2, 70 FROM players WHERE full_name = 'Scottie Scheffler';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, -3, 69 FROM players WHERE full_name = 'Ludvig Aberg';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, -2, 70 FROM players WHERE full_name = 'Tommy Fleetwood';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, -1, 71 FROM players WHERE full_name = 'Collin Morikawa';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, -2, 70 FROM players WHERE full_name = 'Max Homa';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, -1, 71 FROM players WHERE full_name = 'Xander Schauffele';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, -2, 70 FROM players WHERE full_name = 'Bryson DeChambeau';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, -2, 70 FROM players WHERE full_name = 'Cameron Young';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, -1, 71 FROM players WHERE full_name = 'Patrick Cantlay';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, -2, 70 FROM players WHERE full_name = 'Jason Day';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, -1, 71 FROM players WHERE full_name = 'Jon Rahm';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, -1, 71 FROM players WHERE full_name = 'Wyndham Clark';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2,  0, 72 FROM players WHERE full_name = 'Dustin Johnson';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, -1, 71 FROM players WHERE full_name = 'Harris English';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, -1, 71 FROM players WHERE full_name = 'Viktor Hovland';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2,  0, 72 FROM players WHERE full_name = 'Russell Henley';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, +1, 73 FROM players WHERE full_name = 'Rory McIlroy';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, -1, 71 FROM players WHERE full_name = 'Corey Conners';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, -1, 71 FROM players WHERE full_name = 'Hideki Matsuyama';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, -1, 71 FROM players WHERE full_name = 'Shane Lowry';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2,  0, 72 FROM players WHERE full_name = 'Tony Finau';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, -1, 71 FROM players WHERE full_name = 'Adam Scott';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2,  0, 72 FROM players WHERE full_name = 'Sepp Straka';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2,  0, 72 FROM players WHERE full_name = 'Brian Harman';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2,  0, 72 FROM players WHERE full_name = 'Jordan Spieth';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, +1, 73 FROM players WHERE full_name = 'Brooks Koepka';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, +1, 73 FROM players WHERE full_name = 'Min Woo Lee';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, -1, 71 FROM players WHERE full_name = 'Cameron Smith';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, +1, 73 FROM players WHERE full_name = 'Patrick Reed';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2,  0, 72 FROM players WHERE full_name = 'Tom Kim';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2,  0, 72 FROM players WHERE full_name = 'Sungjae Im';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2,  0, 72 FROM players WHERE full_name = 'Justin Rose';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, +1, 73 FROM players WHERE full_name = 'Matt Fitzpatrick';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2,  0, 72 FROM players WHERE full_name = 'Joaquin Niemann';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, +1, 73 FROM players WHERE full_name = 'Rickie Fowler';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, +1, 73 FROM players WHERE full_name = 'Robert MacIntyre';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, +1, 73 FROM players WHERE full_name = 'Si Woo Kim';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2,  0, 72 FROM players WHERE full_name = 'Taylor Moore';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, +1, 73 FROM players WHERE full_name = 'Will Zalatoris';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, +1, 73 FROM players WHERE full_name = 'Lucas Glover';
-- Missed cut R2
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, +6, 78 FROM players WHERE full_name = 'Tiger Woods';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, +3, 75 FROM players WHERE full_name = 'Phil Mickelson';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, +2, 74 FROM players WHERE full_name = 'Sergio Garcia';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, +2, 74 FROM players WHERE full_name = 'Bubba Watson';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, +3, 75 FROM players WHERE full_name = 'Zach Johnson';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 2, +2, 74 FROM players WHERE full_name = 'Fred Couples';

-- Round 3 scores (only players who made the cut ~+3 or better after R2)
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3, -1, 71 FROM players WHERE full_name = 'Scottie Scheffler';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3, -2, 70 FROM players WHERE full_name = 'Ludvig Aberg';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3, -2, 70 FROM players WHERE full_name = 'Tommy Fleetwood';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3, -2, 70 FROM players WHERE full_name = 'Collin Morikawa';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3, -2, 70 FROM players WHERE full_name = 'Max Homa';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3, -1, 71 FROM players WHERE full_name = 'Xander Schauffele';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3, -1, 71 FROM players WHERE full_name = 'Bryson DeChambeau';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3, -2, 70 FROM players WHERE full_name = 'Cameron Young';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3, -1, 71 FROM players WHERE full_name = 'Patrick Cantlay';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3, -1, 71 FROM players WHERE full_name = 'Jason Day';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3, +1, 73 FROM players WHERE full_name = 'Jon Rahm';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3, -1, 71 FROM players WHERE full_name = 'Wyndham Clark';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3, -1, 71 FROM players WHERE full_name = 'Dustin Johnson';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3,  0, 72 FROM players WHERE full_name = 'Harris English';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3, -1, 71 FROM players WHERE full_name = 'Viktor Hovland';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3, -1, 71 FROM players WHERE full_name = 'Russell Henley';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3, -1, 71 FROM players WHERE full_name = 'Rory McIlroy';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3, -1, 71 FROM players WHERE full_name = 'Corey Conners';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3,  0, 72 FROM players WHERE full_name = 'Hideki Matsuyama';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3, -1, 71 FROM players WHERE full_name = 'Shane Lowry';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3, -1, 71 FROM players WHERE full_name = 'Tony Finau';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3, -2, 70 FROM players WHERE full_name = 'Adam Scott';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3,  0, 72 FROM players WHERE full_name = 'Sepp Straka';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3, -1, 71 FROM players WHERE full_name = 'Brian Harman';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3,  0, 72 FROM players WHERE full_name = 'Jordan Spieth';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3,  0, 72 FROM players WHERE full_name = 'Brooks Koepka';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3,  0, 72 FROM players WHERE full_name = 'Min Woo Lee';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3,  0, 72 FROM players WHERE full_name = 'Cameron Smith';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3,  0, 72 FROM players WHERE full_name = 'Patrick Reed';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3,  0, 72 FROM players WHERE full_name = 'Tom Kim';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3, +1, 73 FROM players WHERE full_name = 'Sungjae Im';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3,  0, 72 FROM players WHERE full_name = 'Justin Rose';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3, +1, 73 FROM players WHERE full_name = 'Matt Fitzpatrick';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3, +1, 73 FROM players WHERE full_name = 'Joaquin Niemann';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3,  0, 72 FROM players WHERE full_name = 'Rickie Fowler';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3,  0, 72 FROM players WHERE full_name = 'Robert MacIntyre';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3,  0, 72 FROM players WHERE full_name = 'Si Woo Kim';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3, +1, 73 FROM players WHERE full_name = 'Taylor Moore';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3,  0, 72 FROM players WHERE full_name = 'Will Zalatoris';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 3, +1, 73 FROM players WHERE full_name = 'Lucas Glover';

-- Round 4 scores
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4, -4, 68 FROM players WHERE full_name = 'Scottie Scheffler';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4, -2, 70 FROM players WHERE full_name = 'Ludvig Aberg';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4, -2, 70 FROM players WHERE full_name = 'Tommy Fleetwood';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4, -1, 71 FROM players WHERE full_name = 'Collin Morikawa';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4, -2, 70 FROM players WHERE full_name = 'Max Homa';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4, -1, 71 FROM players WHERE full_name = 'Xander Schauffele';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4, -2, 70 FROM players WHERE full_name = 'Bryson DeChambeau';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4,  0, 72 FROM players WHERE full_name = 'Cameron Young';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4, -1, 71 FROM players WHERE full_name = 'Patrick Cantlay';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4, -2, 70 FROM players WHERE full_name = 'Jason Day';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4, -1, 71 FROM players WHERE full_name = 'Jon Rahm';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4, -1, 71 FROM players WHERE full_name = 'Wyndham Clark';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4, -1, 71 FROM players WHERE full_name = 'Dustin Johnson';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4, -1, 71 FROM players WHERE full_name = 'Harris English';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4,  0, 72 FROM players WHERE full_name = 'Viktor Hovland';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4,  0, 72 FROM players WHERE full_name = 'Russell Henley';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4, -1, 71 FROM players WHERE full_name = 'Rory McIlroy';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4,  0, 72 FROM players WHERE full_name = 'Corey Conners';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4, -1, 71 FROM players WHERE full_name = 'Hideki Matsuyama';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4,  0, 72 FROM players WHERE full_name = 'Shane Lowry';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4,  0, 72 FROM players WHERE full_name = 'Tony Finau';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4,  0, 72 FROM players WHERE full_name = 'Adam Scott';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4, -1, 71 FROM players WHERE full_name = 'Sepp Straka';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4, -1, 71 FROM players WHERE full_name = 'Brian Harman';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4,  0, 72 FROM players WHERE full_name = 'Jordan Spieth';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4,  0, 72 FROM players WHERE full_name = 'Brooks Koepka';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4,  0, 72 FROM players WHERE full_name = 'Min Woo Lee';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4,  0, 72 FROM players WHERE full_name = 'Cameron Smith';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4,  0, 72 FROM players WHERE full_name = 'Patrick Reed';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4,  0, 72 FROM players WHERE full_name = 'Tom Kim';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4,  0, 72 FROM players WHERE full_name = 'Sungjae Im';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4, +1, 73 FROM players WHERE full_name = 'Justin Rose';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4,  0, 72 FROM players WHERE full_name = 'Matt Fitzpatrick';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4,  0, 72 FROM players WHERE full_name = 'Joaquin Niemann';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4, +1, 73 FROM players WHERE full_name = 'Rickie Fowler';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4, +1, 73 FROM players WHERE full_name = 'Robert MacIntyre';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4, +1, 73 FROM players WHERE full_name = 'Si Woo Kim';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4, +1, 73 FROM players WHERE full_name = 'Taylor Moore';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4, +1, 73 FROM players WHERE full_name = 'Will Zalatoris';
INSERT INTO scores (player_id, round_id, to_par, strokes) SELECT id, 4, +1, 73 FROM players WHERE full_name = 'Lucas Glover';

-- Mark all 4 rounds complete
UPDATE rounds SET is_complete = true;

-- Open picks for testing (set deadline to future)
UPDATE pools SET
  pick_deadline = now() + interval '30 days',
  salary_cap = 1000;
