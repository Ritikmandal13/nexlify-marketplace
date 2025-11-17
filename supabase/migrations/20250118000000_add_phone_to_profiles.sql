-- Add phone number to profiles table
-- This enables direct calling between buyers and sellers

-- Add phone number column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS show_phone BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN profiles.phone IS 'User phone number for direct contact';
COMMENT ON COLUMN profiles.show_phone IS 'Whether to display phone number publicly on listings';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;

-- Update RLS policies to allow users to see phone numbers of sellers
-- Users can see phone numbers when:
-- 1. The seller has show_phone = true
-- 2. They are viewing a listing (not enforced here, but in app logic)

-- No additional RLS needed as profiles table already has appropriate policies
-- The show_phone field will be checked in the application layer

