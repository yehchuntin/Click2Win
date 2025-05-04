import { db, isAdminSdkInitialized } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Represents reward information (can be expanded).
 */
export interface Reward {
  /**
   * The reward amount or description.
   */
  amount: number | string;
  type: 'cash' | 'coupon' | 'entry' | 'physical' | string; // Example types
  timestamp?: Date; // Optional timestamp
}

// --- Firestore Global State ---
const GLOBAL_STATE_DOC_ID = '--global-state--'; // Fixed ID for the global document
const GLOBAL_STATE_COLLECTION = 'globals'; // Collection name

/**
 * Gets a reference to the global state document in Firestore.
 * Throws an error if Firestore is not initialized.
 */
function getGlobalStateRef() {
    if (!isAdminSdkInitialized() || !db) {
        throw new Error("Firestore is not initialized on the server.");
    }
    return db.collection(GLOBAL_STATE_COLLECTION).doc(GLOBAL_STATE_DOC_ID);
}

/**
 * Initializes the global state document if it doesn't exist.
 */
async function ensureGlobalStateExists(): Promise<void> {
    const globalStateRef = getGlobalStateRef();
    try {
        const docSnap = await globalStateRef.get();
        if (!docSnap.exists) {
            console.log("Global state document not found, creating with default values.");
            await globalStateRef.set({
                totalClicks: 0,
                // Add other global fields if needed, e.g., currentRewardTargetIndex
            });
        }
    } catch (error) {
        console.error("Error ensuring global state document exists:", error);
        throw new Error("Failed to initialize global state in Firestore.");
    }
}


/**
 * Asynchronously retrieves the global click count from Firestore.
 *
 * @returns A promise that resolves to the global click count.
 * @throws Error if Firestore operation fails or document doesn't exist after check.
 */
export async function getGlobalClickCount(): Promise<number> {
    await ensureGlobalStateExists(); // Make sure the doc exists
    const globalStateRef = getGlobalStateRef();

    try {
        const docSnap = await globalStateRef.get();
        if (docSnap.exists) {
            const data = docSnap.data();
            const count = data?.totalClicks ?? 0; // Default to 0 if field missing
            console.log(`Getting global click count from Firestore: ${count}`);
            return count;
        } else {
            // This case should be handled by ensureGlobalStateExists, but check defensively
            console.error("Global state document unexpectedly missing after ensure check.");
            return 0; // Fallback
        }
    } catch (error) {
        console.error("Error getting global click count from Firestore:", error);
        throw new Error("Failed to retrieve global click count.");
    }
}

/**
 * Asynchronously increments the global click count in Firestore using an atomic operation.
 * @returns A promise that resolves when the count is incremented.
 * @throws Error if Firestore operation fails.
 */
export async function incrementGlobalClickCount(): Promise<void> {
   await ensureGlobalStateExists(); // Ensure the doc exists before trying to increment
   const globalStateRef = getGlobalStateRef();

   try {
       await globalStateRef.update({
           totalClicks: FieldValue.increment(1) // Atomic increment
       });
       console.log(`Incremented global click count in Firestore.`);
   } catch (error) {
       console.error("Error incrementing global click count in Firestore:", error);
       throw new Error("Failed to increment global click count.");
   }
}

/**
 * Resets the global click count in Firestore (for testing or specific logic).
 * @param count The number to reset the count to (defaults to 0).
 * @returns A promise that resolves when the count is reset.
 * @throws Error if Firestore operation fails.
 */
export async function resetGlobalClickCount(count: number = 0): Promise<void> {
    const globalStateRef = getGlobalStateRef();
    try {
        await globalStateRef.set({ // Use set to overwrite or create
            totalClicks: count
        }, { merge: true }); // Merge to avoid overwriting other potential global fields
        console.log(`Reset global click count in Firestore to: ${count}`);
    } catch (error) {
        console.error("Error resetting global click count in Firestore:", error);
        throw new Error("Failed to reset global click count.");
    }
}

// --- Activity Specific Data (Example Structure) ---
// You might store activity progress per user within the user document,
// or in a separate collection like 'userActivities' keyed by userId+activityId.

const ACTIVITY_COLLECTION = 'activities'; // Collection for activity definitions
const USER_ACTIVITY_PROGRESS_COLLECTION = 'userActivityProgress'; // Collection for user progress

interface ActivityDefinition {
    id: string;
    name: string;
    description: string;
    clicksRequired: number;
    reward: Reward; // Reward details
    // Add other activity details (sponsor, image, etc.)
}

interface UserActivityProgress {
    uid: string;
    activityId: string;
    clicks: number;
    completed: boolean;
    rewardClaimed: boolean; // Track if reward was given
    lastUpdated: FieldValue; // Use server timestamp
}

/**
 * Gets the definition of a specific activity.
 * @param activityId The ID of the activity.
 * @returns ActivityDefinition or null if not found.
 */
export async function getActivityDefinition(activityId: string): Promise<ActivityDefinition | null> {
     if (!isAdminSdkInitialized() || !db) {
        throw new Error("Firestore is not initialized on the server.");
    }
    try {
        const docRef = db.collection(ACTIVITY_COLLECTION).doc(activityId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            return docSnap.data() as ActivityDefinition;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching activity definition ${activityId}:`, error);
        throw new Error(`Failed to fetch activity definition ${activityId}.`);
    }
}

/**
 * Gets the progress of a user for a specific activity.
 * @param uid User ID.
 * @param activityId Activity ID.
 * @returns UserActivityProgress or null if no progress recorded yet.
 */
export async function getUserActivityProgress(uid: string, activityId: string): Promise<UserActivityProgress | null> {
     if (!isAdminSdkInitialized() || !db) {
        throw new Error("Firestore is not initialized on the server.");
    }
    // Create a composite key or use separate fields for querying
    const progressDocId = `${uid}_${activityId}`;
    try {
        const docRef = db.collection(USER_ACTIVITY_PROGRESS_COLLECTION).doc(progressDocId);
        const docSnap = await docRef.get();
         if (docSnap.exists) {
            return docSnap.data() as UserActivityProgress;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching user activity progress for ${uid} on ${activityId}:`, error);
        throw new Error(`Failed to fetch user activity progress.`);
    }
}

/**
 * Increments a user's click count for a specific activity.
 * Marks as completed if clicksRequired is met.
 * @param uid User ID.
 * @param activityId Activity ID.
 * @param activityDefinition The definition containing clicksRequired.
 * @returns Updated UserActivityProgress.
 */
export async function incrementUserActivityClick(uid: string, activityId: string, activityDefinition: ActivityDefinition): Promise<UserActivityProgress> {
    if (!isAdminSdkInitialized() || !db) {
        throw new Error("Firestore is not initialized on the server.");
    }
    const progressDocId = `${uid}_${activityId}`;
    const progressRef = db.collection(USER_ACTIVITY_PROGRESS_COLLECTION).doc(progressDocId);

    try {
        const updatedProgress = await db.runTransaction(async (transaction) => {
            const progressSnap = await transaction.get(progressRef);
            let currentClicks = 0;
            let isCompleted = false;
            let rewardClaimed = false;

            if (progressSnap.exists) {
                const data = progressSnap.data() as UserActivityProgress;
                currentClicks = data.clicks;
                isCompleted = data.completed;
                rewardClaimed = data.rewardClaimed; // Preserve claimed status
                 // If already completed, don't increment further (or handle differently)
                 if (isCompleted) {
                     // return data; // Or maybe throw an error "Already completed"
                 }
            }

            const newClicks = currentClicks + 1;
            const justCompleted = !isCompleted && newClicks >= activityDefinition.clicksRequired;

             const updatedData: UserActivityProgress = {
                 uid,
                 activityId,
                 clicks: newClicks,
                 completed: isCompleted || justCompleted,
                 rewardClaimed: rewardClaimed, // Keep existing claimed status
                 lastUpdated: FieldValue.serverTimestamp(),
             };

            if (progressSnap.exists) {
                transaction.update(progressRef, updatedData);
            } else {
                transaction.set(progressRef, updatedData);
            }
            return updatedData;
        });
        console.log(`Incremented activity click for ${uid} on ${activityId}. New clicks: ${updatedProgress.clicks}. Completed: ${updatedProgress.completed}`);
        return updatedProgress;
    } catch (error) {
        console.error(`Error incrementing activity click for ${uid} on ${activityId}:`, error);
        throw new Error(`Failed to increment activity click.`);
    }
}

/**
 * Marks an activity reward as claimed for a user.
 * @param uid User ID.
 * @param activityId Activity ID.
 */
export async function markActivityRewardClaimed(uid: string, activityId: string): Promise<void> {
     if (!isAdminSdkInitialized() || !db) {
        throw new Error("Firestore is not initialized on the server.");
    }
     const progressDocId = `${uid}_${activityId}`;
     const progressRef = db.collection(USER_ACTIVITY_PROGRESS_COLLECTION).doc(progressDocId);

     try {
         await progressRef.update({
             rewardClaimed: true,
             lastUpdated: FieldValue.serverTimestamp(),
         });
         console.log(`Marked reward claimed for ${uid} on activity ${activityId}.`);
     } catch (error) {
          console.error(`Error marking reward claimed for ${uid} on activity ${activityId}:`, error);
         throw new Error(`Failed to mark reward as claimed.`);
     }
}