// src/lib/firebase/server.ts
import * as admin from 'firebase-admin';

// Function to safely initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
    if (admin.apps.length > 0) {
        return admin.app(); // Return existing app if already initialized
    }

    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!serviceAccountEnv) {
        console.warn(
            'Firebase Admin SDK Service Account JSON is not set in environment variables (FIREBASE_SERVICE_ACCOUNT_JSON). Server-side Firebase functionality will be limited.'
        );
        return null; // Indicate initialization failed due to missing config
    }

    try {
        const serviceAccount = JSON.parse(serviceAccountEnv);

        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            // Add other config if needed (e.g., databaseURL)
        });
    } catch (error) {
        console.error('Error initializing Firebase Admin SDK:', error);
        console.error('Ensure FIREBASE_SERVICE_ACCOUNT_JSON is a valid JSON string.');
        return null; // Indicate initialization failed
    }
}

const app = initializeFirebaseAdmin();
const auth = app ? admin.auth() : null;
const db = app ? admin.firestore() : null; // Initialize Firestore if needed

// Function to check if the Admin SDK was successfully initialized
export const isAdminSdkInitialized = (): boolean => !!app;

export { auth, db }; // Export auth and db (or other services)
