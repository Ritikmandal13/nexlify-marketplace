import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCHjPoDI0YC0WC4gMcY8WmctNjWQFDpk3E",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smartthrift-e2a62.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "smartthrift-e2a62",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "smartthrift-e2a62.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "606392385233",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:606392385233:web:66f4f68ce76cf0d3a60ff0",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-V2G3L6TGNW"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { messaging, getToken, onMessage }; 