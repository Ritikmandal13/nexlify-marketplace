import jwt from 'jsonwebtoken';

// Initialize Supabase (inline for Vercel compatibility)
const SUPABASE_URL = 'https://spjvuhlgitqnthcvnpyb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwanZ1aGxnaXRxbnRoY3ZucHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODI3NTAxOSwiZXhwIjoyMDYzODUxMDE5fQ.HHjRCn7Lib3sZbiHbLgipJspaF28IiLRSZECNv7qUxE';

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check for authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No auth token provided' });
  }
  const token = authHeader.split(' ')[1];

  // Decode JWT to get user ID (sub)
  let userId;
  try {
    const { sub } = jwt.decode(token);
    userId = sub;
  } catch (err) {
    return res.status(401).json({ message: 'Invalid auth token' });
  }

  const { token: fcmToken, device_info } = req.body;
  if (!fcmToken) {
    return res.status(400).json({ message: 'No FCM token provided' });
  }

  try {
    // Upsert FCM token using Supabase REST API
    const upsertResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_fcm_tokens`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        user_id: userId,
        fcm_token: fcmToken,
        device_info: device_info,
        updated_at: new Date().toISOString()
      })
    });

    if (!upsertResponse.ok) {
      console.error('Supabase upsert error:', await upsertResponse.text());
      return res.status(500).json({ message: 'Failed to save FCM token' });
    }

    res.status(200).json({ message: 'Token received' });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    res.status(500).json({ message: 'Failed to save FCM token', error: error.message });
  }
} 