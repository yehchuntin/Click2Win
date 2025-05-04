// src/lib/firebase/config.ts

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

function checkFirebaseConfig(): boolean {
    return !!(
        firebaseConfig.apiKey &&
        firebaseConfig.authDomain &&
        firebaseConfig.projectId &&
        firebaseConfig.storageBucket &&
        firebaseConfig.messagingSenderId &&
        firebaseConfig.appId
    );
}

export const isFirebaseConfigured = checkFirebaseConfig();

if (!isFirebaseConfigured && typeof window !== 'undefined') {
    console.warn(`Firebase configuration is incomplete. Please check your environment variables:
        NEXT_PUBLIC_FIREBASE_API_KEY
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
        NEXT_PUBLIC_FIREBASE_PROJECT_ID
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
        NEXT_PUBLIC_FIREBASE_APP_ID
    `);
}
