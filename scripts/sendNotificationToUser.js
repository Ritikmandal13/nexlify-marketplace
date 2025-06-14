import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';
import path from 'path';

// Initialize Supabase client (use your service role key)
const supabase = createClient(
  'https://spjvuhlgitqnthcvnpyb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwanZ1aGxnaXRxbnRoY3ZucHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODI3NTAxOSwiZXhwIjoyMDYzODUxMDE5fQ.HHjRCn7Lib3sZbiHbLgipJspaF28IiLRSZECNv7qUxE'
);

// Initialize Firebase Admin SDK
async function initializeFirebase() {
  if (!admin.apps.length) {
    let serviceAccount;
    
    if (process.env.VERCEL_ENV) {
      serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
        universe_domain: "googleapis.com"
      };
    } else {
      // For local development, use dynamic import
      const { readFileSync } = await import('fs');
      serviceAccount = JSON.parse(readFileSync('serviceAccountKey.json', 'utf8'));
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
}

/**
 * Send a push notification to all devices of a user
 * @param {string} userId - The recipient user's UUID
 * @param {object} notification - { title, body, image?, data? }
 */
export async function sendNotificationToUser(userId, notification) {
  // Initialize Firebase first
  await initializeFirebase();
  
  // 1. Fetch all FCM tokens for the user
  const { data: tokens, error } = await supabase
    .from('user_fcm_tokens')
    .select('fcm_token')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching tokens:', error);
    return;
  }
  if (!tokens || tokens.length === 0) {
    console.log('No tokens found for user.');
    return;
  }

  // 2. Prepare the notification message
  const message = {
    data: {
      title: String(notification.title || ''),
      body: String(notification.body || ''),
      image: String(notification.image || ''),
      ...(notification.data
        ? Object.fromEntries(
            Object.entries(notification.data).map(([k, v]) => [k, String(v ?? '')])
          )
        : {})
    },
    tokens: tokens.map(t => t.fcm_token),
  };

  console.log('Sending to tokens:', message.tokens);

  // 3. Send the notification to all tokens
  try {
    const messaging = admin.messaging();
    const response = await messaging.sendEachForMulticast(message);
    console.log('Successfully sent to devices:', response.successCount);
    if (response.failureCount > 0) {
      response.responses.forEach(async (resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.errorInfo?.code;
          if (errorCode === 'messaging/registration-token-not-registered') {
            // Remove the invalid token from the database
            const badToken = message.tokens[idx];
            await supabase
              .from('user_fcm_tokens')
              .delete()
              .eq('fcm_token', badToken);
            console.log('Removed invalid FCM token:', badToken);
          } else {
            console.error(`Failed to send to token ${message.tokens[idx]}:`, resp.error);
          }
        }
      });
    }
  } catch (err) {
    console.error('Error sending notification:', err);
  }
}

/**
 * Send a push notification to all users except the creator
 * @param {string} creatorUserId - The UUID of the user who created the listing
 * @param {object} notification - { title, body, data? }
 */
export async function sendNotificationToAllUsers(creatorUserId, notification) {
  // Initialize Firebase first
  await initializeFirebase();
  
  // Fetch all user IDs except the creator
  const { data: users, error } = await supabase
    .from('user_fcm_tokens')
    .select('user_id')
    .neq('user_id', creatorUserId)
    .group('user_id'); // Get unique user_ids

  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  if (!users || users.length === 0) {
    console.log('No users found to notify.');
    return;
  }

  // Send a notification to each user
  for (const user of users) {
    await sendNotificationToUser(user.user_id, notification);
  }
} 