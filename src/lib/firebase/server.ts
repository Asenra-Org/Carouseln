import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Using environment variables for Firebase Admin setup
// FIREBASE_SERVICE_ACCOUNT_KEY should be a stringified JSON
const serviceAccountKey = import.meta.env.FIREBASE_SERVICE_ACCOUNT_KEY;

let app;

try {
  if (getApps().length === 0 && serviceAccountKey) {
    const serviceAccount = JSON.parse(serviceAccountKey);
    app = initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    app = getApps()[0];
  }
} catch (error) {
  console.error("Firebase Admin initialization error", error);
}

export const adminAuth = app ? getAuth(app) : null;
export const adminDb = app ? getFirestore(app) : null;
