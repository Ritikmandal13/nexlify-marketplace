import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCHjPoDI0YC0WC4gMcY8WmctNjWQFDpk3E",
  authDomain: "nexlify-e2a62.firebaseapp.com",
  projectId: "nexlify-e2a62",
  storageBucket: "nexlify-e2a62.firebasestorage.app",
  messagingSenderId: "606392385233",
  appId: "1:606392385233:web:66f4f68ce76cf0d3a60ff0",
  measurementId: "G-V2G3L6TGNW"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { messaging, getToken, onMessage }; 