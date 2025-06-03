-- Add has_seen_welcome column to users table
ALTER TABLE users ADD COLUMN has_seen_welcome BOOLEAN DEFAULT FALSE;

-- Update existing users to have seen the welcome page
UPDATE users SET has_seen_welcome = TRUE WHERE created_at < NOW() - INTERVAL '24 hours';

