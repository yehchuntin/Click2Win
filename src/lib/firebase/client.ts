
// src/lib/firebase/client.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signOut } from "firebase/auth"; // Added signOut export
import { getFirestore } from "firebase/firestore";
import { firebaseConfig, isFirebaseConfigured } from "./config";

// Initialize Firebase only if config is valid
const app = !getApps().length && isFirebaseConfigured ? initializeApp(firebaseConfig) : (isFirebaseConfigured ? getApp() : null);
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

export { app, auth, db, signOut }; // Export signOut
