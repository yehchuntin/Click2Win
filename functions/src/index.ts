/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// Import necessary modules
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK (ensure service account key is set up in environment)
// If not already initialized in another file in the functions deployment
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const DEFAULT_DAILY_QUOTA = 50; // Keep consistent with backend service

// Scheduled function to reset daily clicks and quota for all users
// Runs daily at midnight Asia/Taipei time (00:00) which is 16:00 UTC
// Use crontab guru: https://crontab.guru/#0_16_*_*_*
export const resetDaily = functions.pubsub
  .schedule("0 16 * * *") // 16:00 UTC is 00:00 Asia/Taipei
  .timeZone("UTC") // Firebase schedules run in UTC
  .onRun(async (context) => {
    functions.logger.info("Starting daily reset function.", {structuredData: true});

    const usersRef = db.collection("users");
    const batch = db.batch();
    let count = 0;

    try {
      // Get all users. For very large user bases, consider pagination or querying differently.
      const snapshot = await usersRef.get();

      if (snapshot.empty) {
        functions.logger.info("No users found to reset.");
        return null;
      }

      snapshot.forEach((doc) => {
        functions.logger.debug(`Scheduling reset for user: ${doc.id}`);
        // Reset todayClicks to 0 and dailyQuota to the default value
        // Consider if dailyQuota should be dynamic based on user level/status in the future
        batch.update(doc.ref, {
          todayClicks: 0,
          dailyQuota: DEFAULT_DAILY_QUOTA,
          // Optionally reset other daily counters here if needed
        });
        count++;
      });

      // Commit the batch update
      await batch.commit();
      functions.logger.info(`Successfully reset daily counts for ${count} users.`);
      return null;
    } catch (error) {
      functions.logger.error("Error during daily reset:", error);
      // Optionally, implement retry logic or error reporting
      return null; // Indicate failure but don't necessarily crash function
    }
  });

// You can add other Firebase Functions here (e.g., HTTPS callable functions, Firestore triggers)
