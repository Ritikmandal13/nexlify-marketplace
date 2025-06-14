import { createClient } from '@supabase/supabase-js';

// Your Supabase project details
const SUPABASE_URL = 'https://spjvuhlgitqnthcvnpyb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwanZ1aGxnaXRxbnRoY3ZucHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODI3NTAxOSwiZXhwIjoyMDYzODUxMDE5fQ.HHjRCn7Lib3sZbiHbLgipJspaF28IiLRSZECNv7qUxE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Upsert an FCM token for a user (supports multiple devices per user)
 * @param {string} userId - The user's UUID
 * @param {string} fcmToken - The FCM token
 * @param {string|null} deviceInfo - Optional device info (browser, device type, etc.)
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export async function upsertFcmToken(userId, fcmToken, deviceInfo = null) {
  const { error } = await supabase
    .from('user_fcm_tokens')
    .upsert(
      {
        user_id: userId,
        fcm_token: fcmToken,
        device_info: deviceInfo,
        updated_at: new Date().toISOString()
      },
      { onConflict: ['user_id', 'fcm_token'] }
    );

  if (error) {
    console.error('Error upserting FCM token:', error);
    return false;
  }
  return true;
} 