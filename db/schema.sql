-- The optional account (api/): an email to sign in with a code, its sessions and its synced progress. Idempotent:
-- `npm run db:migrate` applies it as many times as needed.

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
