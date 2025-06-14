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

  const diagnostic = {
    timestamp: new Date().toISOString(),
    environment: {},
    firebaseInit: {}
  };

  try {
    // Check environment variables
    diagnostic.environment = {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'MISSING',
      FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID || 'MISSING',
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || 'MISSING',
      FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID || 'MISSING',
      FIREBASE_CLIENT_X509_CERT_URL: process.env.FIREBASE_CLIENT_X509_CERT_URL || 'MISSING',
      FIREBASE_PRIVATE_KEY_LENGTH: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
      FIREBASE_PRIVATE_KEY_STARTS_WITH: process.env.FIREBASE_PRIVATE_KEY?.substring(0, 30) || 'MISSING',
      NODE_ENV: process.env.NODE_ENV || 'unknown'
    };

    // Try to import Firebase Admin
    let admin;
    try {
      admin = await import('firebase-admin');
      diagnostic.firebaseInit.importSuccess = true;
      diagnostic.firebaseInit.currentAppsLength = admin.default.apps.length;
    } catch (importError) {
      diagnostic.firebaseInit.importError = importError.message;
      return res.status(500).json({ success: false, diagnostic });
    }

    // Build service account object
    const serviceAccount = {
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

    diagnostic.firebaseInit.serviceAccountValid = {
      hasProjectId: !!serviceAccount.project_id,
      hasPrivateKeyId: !!serviceAccount.private_key_id,
      hasPrivateKey: !!serviceAccount.private_key,
      hasClientEmail: !!serviceAccount.client_email,
      privateKeyFormat: serviceAccount.private_key?.includes('-----BEGIN PRIVATE KEY-----'),
      privateKeyLength: serviceAccount.private_key?.length
    };

    // Try to initialize Firebase
    try {
      if (admin.default.apps.length === 0) {
        const app = admin.default.initializeApp({
          credential: admin.default.credential.cert(serviceAccount)
        });
        diagnostic.firebaseInit.initSuccess = true;
        diagnostic.firebaseInit.appName = app.name;
        diagnostic.firebaseInit.finalAppsLength = admin.default.apps.length;
      } else {
        diagnostic.firebaseInit.alreadyInitialized = true;
        diagnostic.firebaseInit.finalAppsLength = admin.default.apps.length;
      }
    } catch (initError) {
      diagnostic.firebaseInit.initError = initError.message;
      diagnostic.firebaseInit.initStack = initError.stack;
    }

    // Test messaging
    try {
      const messaging = admin.default.messaging();
      diagnostic.firebaseInit.messagingCreated = true;
    } catch (messagingError) {
      diagnostic.firebaseInit.messagingError = messagingError.message;
    }

    res.status(200).json({
      success: diagnostic.firebaseInit.initSuccess || diagnostic.firebaseInit.alreadyInitialized,
      diagnostic
    });

  } catch (error) {
    diagnostic.globalError = {
      message: error.message,
      stack: error.stack
    };
    
    res.status(500).json({
      success: false,
      diagnostic
    });
  }
} 