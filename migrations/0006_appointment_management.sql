ALTER TABLE appointments ADD COLUMN management_token_hash TEXT;
ALTER TABLE appointments ADD COLUMN management_token_ciphertext TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS appointments_management_token_hash
  ON appointments (management_token_hash)
  WHERE management_token_hash IS NOT NULL;
