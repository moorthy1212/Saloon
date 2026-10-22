CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  slot_start TEXT NOT NULL UNIQUE,
  customer_ciphertext TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  email_notified INTEGER NOT NULL DEFAULT 0,
  whatsapp_notified INTEGER NOT NULL DEFAULT 0
);
