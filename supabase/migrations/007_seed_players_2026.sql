-- 007_seed_players_2026.sql
-- 2026 Masters Field (91 players)
-- World rankings approximate as of early April 2026
-- Salaries based on approximate 2026 Masters win odds

-- Clear old test scores (2024 data no longer relevant)
DELETE FROM scores;

-- Deactivate all existing players
UPDATE players SET is_active = false;

-- ============================================================
-- UPDATE existing players with 2026 data
-- ============================================================
UPDATE players SET is_active = true, world_ranking = 1,   country = 'USA', salary = 310 WHERE full_name = 'Scottie Scheffler';
UPDATE players SET is_active = true, world_ranking = 2,   country = 'NIR', salary = 195 WHERE full_name = 'Rory McIlroy';
UPDATE players SET is_active = true, world_ranking = 3,   country = 'USA', salary = 175 WHERE full_name = 'Xander Schauffele';
UPDATE players SET is_active = true, world_ranking = 4,   country = 'USA', salary = 165 WHERE full_name = 'Collin Morikawa';
UPDATE players SET is_active = true, world_ranking = 5,   country = 'SWE', salary = 155 WHERE full_name = 'Ludvig Aberg';
UPDATE players SET is_active = true, world_ranking = 6,   country = 'NOR', salary = 145 WHERE full_name = 'Viktor Hovland';
UPDATE players SET is_active = true, world_ranking = 7,   country = 'ENG', salary = 130 WHERE full_name = 'Tommy Fleetwood';
UPDATE players SET is_active = true, world_ranking = 8,   country = 'USA', salary = 120 WHERE full_name = 'Patrick Cantlay';
UPDATE players SET is_active = true, world_ranking = 9,   country = 'ESP', salary = 150 WHERE full_name = 'Jon Rahm';
UPDATE players SET is_active = true, world_ranking = 10,  country = 'IRL', salary = 80  WHERE full_name = 'Shane Lowry';
UPDATE players SET is_active = true, world_ranking = 11,  country = 'ENG', salary = 70  WHERE full_name = 'Tyrrell Hatton';
UPDATE players SET is_active = true, world_ranking = 12,  country = 'USA', salary = 100 WHERE full_name = 'Cameron Young';
UPDATE players SET is_active = true, world_ranking = 13,  country = 'AUS', salary = 85  WHERE full_name = 'Min Woo Lee';
UPDATE players SET is_active = true, world_ranking = 14,  country = 'USA', salary = 110 WHERE full_name = 'Justin Thomas';
UPDATE players SET is_active = true, world_ranking = 15,  country = 'JPN', salary = 95  WHERE full_name = 'Hideki Matsuyama';
UPDATE players SET is_active = true, world_ranking = 16,  country = 'USA', salary = 55  WHERE full_name = 'Russell Henley';
UPDATE players SET is_active = true, world_ranking = 17,  country = 'USA', salary = 75  WHERE full_name = 'Akshay Bhatia';
UPDATE players SET is_active = true, world_ranking = 18,  country = 'USA', salary = 60  WHERE full_name = 'Sam Burns';
UPDATE players SET is_active = true, world_ranking = 19,  country = 'AUT', salary = 50  WHERE full_name = 'Sepp Straka';
UPDATE players SET is_active = true, world_ranking = 20,  country = 'SCO', salary = 65  WHERE full_name = 'Robert MacIntyre';
UPDATE players SET is_active = true, world_ranking = 21,  country = 'USA', salary = 50  WHERE full_name = 'Max Homa';
UPDATE players SET is_active = true, world_ranking = 22,  country = 'KOR', salary = 45  WHERE full_name = 'Sungjae Im';
UPDATE players SET is_active = true, world_ranking = 23,  country = 'USA', salary = 45  WHERE full_name = 'Brian Harman';
UPDATE players SET is_active = true, world_ranking = 24,  country = 'KOR', salary = 45  WHERE full_name = 'Si Woo Kim';
UPDATE players SET is_active = true, world_ranking = 25,  country = 'USA', salary = 50  WHERE full_name = 'Keegan Bradley';
UPDATE players SET is_active = true, world_ranking = 26,  country = 'AUS', salary = 45  WHERE full_name = 'Jason Day';
UPDATE players SET is_active = true, world_ranking = 27,  country = 'ENG', salary = 40  WHERE full_name = 'Matt Fitzpatrick';
UPDATE players SET is_active = true, world_ranking = 28,  country = 'USA', salary = 90  WHERE full_name = 'Jordan Spieth';
UPDATE players SET is_active = true, world_ranking = 29,  country = 'USA', salary = 60  WHERE full_name = 'Wyndham Clark';
UPDATE players SET is_active = true, world_ranking = 30,  country = 'CAN', salary = 40  WHERE full_name = 'Corey Conners';
UPDATE players SET is_active = true, world_ranking = 35,  country = 'AUS', salary = 40  WHERE full_name = 'Adam Scott';
UPDATE players SET is_active = true, world_ranking = 36,  country = 'AUS', salary = 40  WHERE full_name = 'Cameron Smith';
UPDATE players SET is_active = true, world_ranking = 37,  country = 'USA', salary = 40  WHERE full_name = 'Brooks Koepka';
UPDATE players SET is_active = true, world_ranking = 38,  country = 'USA', salary = 40  WHERE full_name = 'Bryson DeChambeau';
UPDATE players SET is_active = true, world_ranking = 39,  country = 'USA', salary = 35  WHERE full_name = 'Dustin Johnson';
UPDATE players SET is_active = true, world_ranking = 40,  country = 'USA', salary = 35  WHERE full_name = 'Patrick Reed';
UPDATE players SET is_active = true, world_ranking = 41,  country = 'USA', salary = 35  WHERE full_name = 'Harris English';
UPDATE players SET is_active = true, world_ranking = 42,  country = 'SWE', salary = 35  WHERE full_name = 'Alex Noren';
UPDATE players SET is_active = true, world_ranking = 43,  country = 'NZL', salary = 35  WHERE full_name = 'Ryan Fox';
UPDATE players SET is_active = true, world_ranking = 44,  country = 'USA', salary = 35  WHERE full_name = 'Jake Knapp';
UPDATE players SET is_active = true, world_ranking = 51,  country = 'ENG', salary = 35  WHERE full_name = 'Justin Rose';
UPDATE players SET is_active = true, world_ranking = 52,  country = 'ENG', salary = 35  WHERE full_name = 'Aaron Rai';
UPDATE players SET is_active = true, world_ranking = 53,  country = 'USA', salary = 30  WHERE full_name = 'Kurt Kitayama';
UPDATE players SET is_active = true, world_ranking = 54,  country = 'USA', salary = 30  WHERE full_name = 'Davis Riley';
UPDATE players SET is_active = true, world_ranking = 55,  country = 'ENG', salary = 30  WHERE full_name = 'Harry Hall';
UPDATE players SET is_active = true, world_ranking = 56,  country = 'COL', salary = 30  WHERE full_name = 'Nico Echavarria';
UPDATE players SET is_active = true, world_ranking = 57,  country = 'USA', salary = 30  WHERE full_name = 'Ben Griffin';
UPDATE players SET is_active = true, world_ranking = 62,  country = 'USA', salary = 30  WHERE full_name = 'Michael Kim';
UPDATE players SET is_active = true, world_ranking = 150, country = 'ENG', salary = 30  WHERE full_name = 'Danny Willett';
UPDATE players SET is_active = true, world_ranking = 170, country = 'USA', salary = 30  WHERE full_name = 'Gary Woodland';
UPDATE players SET is_active = true, world_ranking = 200, country = 'RSA', salary = 30  WHERE full_name = 'Charl Schwartzel';
UPDATE players SET is_active = true, world_ranking = 999, country = 'USA', salary = 30  WHERE full_name = 'Fred Couples';
UPDATE players SET is_active = true, world_ranking = 999, country = 'ESP', salary = 30  WHERE full_name = 'Sergio Garcia';
UPDATE players SET is_active = true, world_ranking = 999, country = 'ESP', salary = 30  WHERE full_name = 'Jose Maria Olazabal';
UPDATE players SET is_active = true, world_ranking = 999, country = 'RSA', salary = 30  WHERE full_name = 'Mike Weir';
UPDATE players SET is_active = true, world_ranking = 999, country = 'FIJ', salary = 30  WHERE full_name = 'Vijay Singh';
UPDATE players SET is_active = true, world_ranking = 500, country = 'USA', salary = 30  WHERE full_name = 'Zach Johnson';
UPDATE players SET is_active = true, world_ranking = 500, country = 'USA', salary = 30  WHERE full_name = 'Bubba Watson';
UPDATE players SET is_active = true, world_ranking = 999, country = 'ARG', salary = 30  WHERE full_name = 'Angel Cabrera';

-- ============================================================
-- INSERT new 2026 players not in the previous field
-- ============================================================
INSERT INTO players (full_name, country, world_ranking, is_active, salary) VALUES
  ('Justin Thomas',         'USA', 14,   true, 110),
  ('Nicolai Hojgaard',      'DEN', 31,   true, 40),
  ('Rasmus Hojgaard',       'DEN', 32,   true, 35),
  ('Daniel Berger',         'USA', 45,   true, 35),
  ('Max Greyserman',        'USA', 46,   true, 35),
  ('Maverick McNealy',      'USA', 48,   true, 30),
  ('Andrew Novak',          'USA', 47,   true, 35),
  ('Tom McKibbin',          'NIR', 49,   true, 35),
  ('J.J. Spaun',            'USA', 50,   true, 30),
  ('Sam Stevens',           'USA', 58,   true, 30),
  ('Brandon Holtz',         'USA', 55,   true, 30),
  ('Kristoffer Reitan',     'NOR', 60,   true, 30),
  ('Chris Gotterup',        'USA', 44,   true, 35),
  ('Haotong Li',            'CHN', 65,   true, 30),
  ('Brian Campbell',        'USA', 70,   true, 30),
  ('Sami Valimaki',         'FIN', 72,   true, 30),
  ('Marco Penge',           'ENG', 73,   true, 30),
  ('Casey Jarvis',          'RSA', 74,   true, 30),
  ('Aldrich Potgieter',     'RSA', 75,   true, 30),
  ('Carlos Ortiz',          'MEX', 80,   true, 30),
  ('Danny Willett',         'ENG', 150,  true, 30),
  ('Gary Woodland',         'USA', 170,  true, 30),
  ('Charl Schwartzel',      'RSA', 200,  true, 30),
  ('Nick Taylor',           'CAN', 76,   true, 30),
  ('Naoyuki Kataoka',       'JPN', 300,  true, 30),
  ('Matt McCarty',          'USA', 67,   true, 30),
  ('Jacob Bridgeman',       'USA', 68,   true, 30),
  ('Rasmus Neergaard-Petersen', 'DEN', 9999, true, 30),
  ('Ethan Fang',            'USA', 9999, true, 30),
  ('Fifa Laopakdee',        'THA', 9999, true, 30),
  ('Mateo Pulcini',         'ARG', 9999, true, 30),
  ('Jackson Herrington',    'USA', 9999, true, 30),
  ('Johnny Keefer',         'USA', 9999, true, 30),
  ('Mason Howell',          'USA', 9999, true, 30),
  ('Michael Brennan',       'USA', 9999, true, 30),
  ('Ryan Gerard',           'USA', 9999, true, 30),
  ('Vijay Singh',           'FIJ', 999,  true, 30),
  ('Angel Cabrera',         'ARG', 999,  true, 30)
ON CONFLICT DO NOTHING;

-- Remove old players no longer in the field (keep inactive ones for history)
-- These are already set to is_active = false by the UPDATE above

-- Verify active count
SELECT COUNT(*) as active_players FROM players WHERE is_active = true;
