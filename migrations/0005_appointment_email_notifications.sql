ALTER TABLE appointments ADD COLUMN customer_email_notified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE appointments ADD COLUMN salon_email_notified INTEGER NOT NULL DEFAULT 0;
