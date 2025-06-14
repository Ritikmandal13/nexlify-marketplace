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

    // Better private key handling for Vercel
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    let privateKeyProcessingSteps = [];
    
    if (privateKey) {
      privateKeyProcessingSteps.push(`Original length: ${privateKey.length}`);
      privateKeyProcessingSteps.push(`Original starts with: ${privateKey.substring(0, 50)}`);
      
      // Handle different possible formats
      privateKey = privateKey.replace(/\\n/g, '\n'); // Replace literal \n with actual newlines
      privateKeyProcessingSteps.push(`After \\n replacement: ${privateKey.substring(0, 50)}`);
      
      privateKey = privateKey.replace(/\\\\/g, '\\'); // Replace double backslashes
      privateKeyProcessingSteps.push(`After \\\\ replacement: ${privateKey.substring(0, 50)}`);
      
      // Ensure proper formatting
      if (!privateKey.includes('\n')) {
        privateKeyProcessingSteps.push('No newlines found, adding manually');
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
        privateKeyProcessingSteps.push(`After manual formatting: ${privateKey.substring(0, 100)}`);
      } else {
        privateKeyProcessingSteps.push('Newlines found in key');
      }
      
      privateKeyProcessingSteps.push(`Final length: ${privateKey.length}`);
      privateKeyProcessingSteps.push(`Final format check: ${privateKey.includes('-----BEGIN PRIVATE KEY-----') && privateKey.includes('-----END PRIVATE KEY-----')}`);
    }

    diagnostic.firebaseInit.privateKeyProcessing = privateKeyProcessingSteps;

    // Build service account object
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

    diagnostic.firebaseInit.serviceAccountValid = {
      hasProjectId: !!serviceAccount.project_id,
      hasPrivateKeyId: !!serviceAccount.private_key_id,
      hasPrivateKey: !!serviceAccount.private_key,
      hasClientEmail: !!serviceAccount.client_email,
      privateKeyFormat: serviceAccount.private_key?.includes('-----BEGIN PRIVATE KEY-----'),
      privateKeyLength: serviceAccount.private_key?.length,
      privateKeyLines: serviceAccount.private_key?.split('\n').length
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