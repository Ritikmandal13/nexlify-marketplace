import admin from 'firebase-admin';

// Initialize Supabase (inline for Vercel compatibility)
const SUPABASE_URL = 'https://spjvuhlgitqnthcvnpyb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwanZ1aGxnaXRxbnRoY3ZucHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODI3NTAxOSwiZXhwIjoyMDYzODUxMDE5fQ.HHjRCn7Lib3sZbiHbLgipJspaF28IiLRSZECNv7qUxE';

// Initialize Firebase Admin SDK using only FIREBASE_SERVICE_ACCOUNT_JSON
if (!admin.apps.length) {
  try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON env variable is missing');
    }
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
}

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

  try {
    console.log('Received body:', req.body);
    const { recipientUserId, messageText, senderName, chatId } = req.body;
    
    if (!recipientUserId || !messageText || !senderName || !chatId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if Firebase is initialized
    if (!admin.apps.length) {
      throw new Error('Firebase Admin SDK not initialized');
    }

    // Fetch FCM tokens from Supabase
    const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_fcm_tokens?user_id=eq.${recipientUserId}&select=fcm_token`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!supabaseResponse.ok) {
      throw new Error(`Supabase error: ${supabaseResponse.status}`);
    }

    const tokens = await supabaseResponse.json();
    console.log('Found tokens:', tokens.length);

    if (!tokens || tokens.length === 0) {
      console.log('No tokens found for user');
      return res.status(200).json({ success: true, message: 'No tokens found' });
    }

    // Send notification via Firebase
    const message = {
      data: {
        title: `New message from ${senderName}`,
        body: messageText,
        url: `https://nexlify-marketplace-git-main-ritik-manda.vercel.app/chat/${chatId}`
      },
      tokens: tokens.map(t => t.fcm_token),
    };

    console.log('Sending to tokens:', message.tokens);

    const messaging = admin.messaging();
    const response = await messaging.sendEachForMulticast(message);
    
    console.log('Successfully sent to devices:', response.successCount);
    
    if (response.failureCount > 0) {
      console.log('Failed to send to some devices:', response.failureCount);
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`Failed to send to token ${message.tokens[idx]}:`, resp.error);
        }
      });
    }

    res.status(200).json({ 
      success: true, 
      successCount: response.successCount,
      failureCount: response.failureCount 
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ 
      message: 'Failed to send notification', 
      error: error.message 
    });
  }
} 