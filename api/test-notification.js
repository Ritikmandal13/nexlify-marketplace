import admin from 'firebase-admin';

// Initialize Firebase Admin SDK for Vercel (do it once at module level)
if (!admin.apps.length) {
  try {
    // Better private key handling for Vercel
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
      // Handle different possible formats
      privateKey = privateKey.replace(/\\n/g, '\n'); // Replace literal \n with actual newlines
      privateKey = privateKey.replace(/\\\\/g, '\\'); // Replace double backslashes
      // Ensure proper formatting
      if (!privateKey.includes('\n')) {
        // If still no newlines, try to add them manually
        privateKey = privateKey.replace(/-----BEGIN PRIVATE KEY-----/g, '-----BEGIN PRIVATE KEY-----\n');
        privateKey = privateKey.replace(/-----END PRIVATE KEY-----/g, '\n-----END PRIVATE KEY-----');
        // Add newlines every 64 characters in the key content
        const beginIndex = privateKey.indexOf('-----BEGIN PRIVATE KEY-----\n') + '-----BEGIN PRIVATE KEY-----\n'.length;
        const endIndex = privateKey.indexOf('\n-----END PRIVATE KEY-----');
        if (beginIndex < endIndex) {
          const keyContent = privateKey.substring(beginIndex, endIndex);
          const formattedKeyContent = keyContent.replace(/(.{64})/g, '$1\n');
          privateKey = privateKey.substring(0, beginIndex) + formattedKeyContent + privateKey.substring(endIndex);
        }
      }
    }

    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: privateKey,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      universe_domain: "googleapis.com"
    };

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

  try {
    const debug = {
      timestamp: new Date().toISOString(),
      firebaseAppsLength: admin.apps.length,
      firebaseInitialized: admin.apps.length > 0
    };

    // Check if Firebase is initialized
    if (!admin.apps.length) {
      return res.status(500).json({ 
        success: false, 
        error: 'Firebase Admin SDK not initialized',
        debug 
      });
    }

    // Test Firebase Messaging instance
    try {
      const messaging = admin.messaging();
      debug.messagingAvailable = true;
    } catch (err) {
      debug.messagingError = err.message;
    }

    res.status(200).json({
      success: true,
      message: 'Firebase Admin SDK is working!',
      debug
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
} 