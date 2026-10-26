-- The optional account (api/): an email to sign in with a code, its sessions and its synced progress. Idempotent:
-- `npm run db:migrate` applies it as many times as needed.
-- It runs whole on every deploy with no record of what ran (db/migrate.js), so a published table only changes by an
-- `ALTER TABLE … ADD COLUMN IF NOT EXISTS` (or another IF NOT EXISTS statement) appended below it: editing the body of
-- a CREATE TABLE already deployed reaches new installs but never production. No ';' or '--' inside a literal either:
-- migrate.js strips comments and splits on ';' without parsing.

CREATE TABLE IF NOT EXISTS users (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL UNIQUE, -- lowercased by the API
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

-- One live code per email (a new one replaces it); only its HMAC is stored
CREATE TABLE IF NOT EXISTS login_codes (
  email text PRIMARY KEY,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- The cookie holds the token; only its SHA-256 is stored
CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions (user_id);

-- A key of the app's localStorage per row (src/backup-keys.js); value null = deleted (a tombstone);
-- updated_at = the version (ms) the device gave it
CREATE TABLE IF NOT EXISTS progress (
  user_id integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  key text NOT NULL,
  value text,
  updated_at bigint NOT NULL,
  PRIMARY KEY (user_id, key)
);

-- Rate limits: one row per counted request, bucket = HMAC of what is limited (email, IP, user)
CREATE TABLE IF NOT EXISTS rate_events (
  bucket text NOT NULL,
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_events_bucket_at ON rate_events (bucket, at);

-- The daily challenge (api/daily.js): the account's public name in the rankings (null = "Anónimo"; unique) and one result per
-- account and UTC day, the first sent. penalty: '0', '2000' (+2) or 'DNF'; verified: a smart cube's moves solved it.
ALTER TABLE users ADD COLUMN IF NOT EXISTS name text;
CREATE UNIQUE INDEX IF NOT EXISTS users_name_lower ON users (lower(name)); -- one account per name, case aside
CREATE TABLE IF NOT EXISTS daily_results (
  day date NOT NULL,
  user_id integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  ms integer NOT NULL,
  penalty text NOT NULL CHECK (penalty IN ('0', '2000', 'DNF')),
  verified boolean NOT NULL DEFAULT false,
  at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (day, user_id)
);

-- The weekly challenge (api/daily.js ?week): one row per account, week (its Monday, UTC) and solve (idx 0 to 4), each
-- the first sent; ranked by the WCA average of the 5 (api/_lib/weekly.js). penalty and verified as the daily's.
CREATE TABLE IF NOT EXISTS weekly_results (
  week date NOT NULL,
  user_id integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  idx smallint NOT NULL CHECK (idx BETWEEN 0 AND 4),
  ms integer NOT NULL,
  penalty text NOT NULL CHECK (penalty IN ('0', '2000', 'DNF')),
  verified boolean NOT NULL DEFAULT false,
  at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (week, user_id, idx)
);

-- The daily reminder (api/push.js, api/cron/reminders.js): one Web Push subscription per browser. hour: the local hour
-- chosen (0–23); tz_offset: the browser's getTimezoneOffset() (minutes); due: the cases due at the next reminder as the
-- page last saw them (due_at), null if unknown; user_id: the account signed in when it subscribed, if any.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  endpoint text PRIMARY KEY,
  p256dh text NOT NULL,
  auth text NOT NULL,
  hour smallint NOT NULL CHECK (hour BETWEEN 0 AND 23),
  tz_offset smallint NOT NULL,
  due integer,
  due_at timestamptz NOT NULL DEFAULT now(),
  lang text NOT NULL DEFAULT 'es',
  user_id integer REFERENCES users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_sent timestamptz
);

-- When an account first played each challenge's scramble (api/daily.js POST ?play, at Jugar): 'd:<day>' or
-- 'w:<week>:<idx>'. A verified result must be sent at least its time after it (the time can't predate the scramble).
-- ponytail: kept forever (a few rows a week per player); dropped with old days if it ever weighs.
CREATE TABLE IF NOT EXISTS challenge_plays (
  user_id integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  challenge text NOT NULL,
  at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, challenge)
);

-- The challenges' scrambles (api/daily.js), by the same keys as challenge_plays: 'd:<day>' and 'w:<week>:<idx>'. Made by
-- db/scrambles.js (npm run db:migrate, in every build), a year ahead: in the database, not in the code, so they stay
-- unknown until played.
CREATE TABLE IF NOT EXISTS challenge_scrambles (
  challenge text PRIMARY KEY,
  scramble text NOT NULL
);
