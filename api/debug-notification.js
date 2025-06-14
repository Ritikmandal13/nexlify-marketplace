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
      nodeVersion: process.version,
      environment: {
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'SET' : 'MISSING',
        FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID ? 'SET' : 'MISSING',
        FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'MISSING',
        FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID ? 'SET' : 'MISSING',
        FIREBASE_CLIENT_X509_CERT_URL: process.env.FIREBASE_CLIENT_X509_CERT_URL ? 'SET' : 'MISSING',
        FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'SET (length: ' + process.env.FIREBASE_PRIVATE_KEY?.length + ')' : 'MISSING',
      }
    };

    // Test Supabase connection
    const SUPABASE_URL = 'https://spjvuhlgitqnthcvnpyb.supabase.co';
    const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwanZ1aGxnaXRxbnRoY3ZucHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODI3NTAxOSwiZXhwIjoyMDYzODUxMDE5fQ.HHjRCn7Lib3sZbiHbLgipJspaF28IiLRSZECNv7qUxE';
    
    try {
      const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_fcm_tokens?select=count`, {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      debug.supabase = {
        status: supabaseResponse.status,
        ok: supabaseResponse.ok
      };
    } catch (err) {
      debug.supabase = {
        error: err.message
      };
    }

    // Test Firebase Admin import
    try {
      const admin = await import('firebase-admin');
      debug.firebaseAdmin = {
        imported: true,
        hasApps: !!admin.default.apps,
        appsLength: admin.default.apps.length
      };
    } catch (err) {
      debug.firebaseAdmin = {
        error: err.message
      };
    }

    res.status(200).json({
      success: true,
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