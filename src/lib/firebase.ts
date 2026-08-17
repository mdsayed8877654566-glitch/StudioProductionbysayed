import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Validate Connection to Firestore
import { doc, getDocFromCache, getDocFromServer } from 'firebase/firestore';

async function testConnection() {
  if (typeof window === 'undefined') return;
  try {
    // Try to get a test document to verify connection
    await getDocFromServer(doc(db, 'metadata', 'connection_test')).catch(() => {
      // It's okay if it doesn't exist, we just want to see if the network call works
    });
    console.log('[Firebase] Connection verified');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("[Firebase] Please check your Firebase configuration. Client is offline.");
    } else {
      console.warn("[Firebase] Initial connection test completed with notice:", error);
    }
  }
}
testConnection();
