import { db, isAdminSdkInitialized } from '@/lib/firebase/server'; // Use server db for backend logic
import { FieldValue } from 'firebase-admin/firestore'; // Use FieldValue for atomic operations

/**
 * Represents a user account structure in Firestore.
 */
export interface UserAccount {
  /**
   * The unique identifier for the user (matches Firebase Auth UID).
   */
  uid: string; // Changed from userId to uid to match Firebase Auth
  /**
   * User's email address.
   */
  email?: string;
  /**
   * User's display name.
   */
  displayName?: string;
  /**
   * The number of clicks the user has made today.
   */
  todayClicks: number;
  /**
   * The maximum number of clicks allowed for the user today.
   */
  dailyQuota: number;
  /**
   * The total number of clicks the user has ever made.
   */
  totalClicks: number;
  /**
   * An array to store rewards earned by the user.
   * Define a Reward interface if needed.
   */
  rewards: any[]; // Define a specific Reward type later
}

const DEFAULT_DAILY_QUOTA = 50;

// --- Firestore Operations ---

/**
 * Gets a reference to the users collection in Firestore.
 * Throws an error if Firestore is not initialized.
 */
function getUsersCollection() {
    if (!isAdminSdkInitialized() || !db) {
        throw new Error("Firestore is not initialized on the server.");
    }
    return db.collection('users');
}

/**
 * Ensures a user document exists in Firestore, creating a default entry if not.
 * This is often called after a successful sign-in or when accessing user data.
 *
 * @param uid The Firebase Auth UID of the user.
 * @param email The user's email (optional, for initial creation).
 * @param displayName The user's display name (optional, for initial creation).
 * @returns A promise that resolves when the user document exists.
 * @throws Error if Firestore operation fails.
 */
export async function ensureUserExists(uid: string, email?: string, displayName?: string): Promise<void> {
    const usersCollection = getUsersCollection();
    const userRef = usersCollection.doc(uid);

    try {
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            console.log(`User ${uid} not found in Firestore, creating default entry.`);
            const newUser: UserAccount = {
                uid: uid,
                email: email || '',
                displayName: displayName || 'Anonymous User',
                todayClicks: 0,
                dailyQuota: DEFAULT_DAILY_QUOTA,
                totalClicks: 0,
                rewards: [],
            };
            await userRef.set(newUser);
            console.log(`User ${uid} created in Firestore.`);
        } else {
            // Optional: Update email/displayName if they've changed since last login
            const updates: Partial<UserAccount> = {};
            const existingData = userSnap.data() as UserAccount | undefined;
            if (email && existingData?.email !== email) updates.email = email;
            if (displayName && existingData?.displayName !== displayName) updates.displayName = displayName;
            if (Object.keys(updates).length > 0) {
                 await userRef.update(updates);
                 console.log(`Updated basic info for user ${uid}.`);
            }
            // Note: Daily reset logic is handled by the scheduled function now.
        }
    } catch (error) {
        console.error(`Error ensuring user ${uid} exists in Firestore:`, error);
        throw new Error(`Failed to ensure user ${uid} exists.`);
    }
}


/**
 * Asynchronously retrieves a user account by UID from Firestore.
 *
 * @param uid The Firebase Auth UID of the user account to retrieve.
 * @returns A promise that resolves to a UserAccount object or null if not found.
 * @throws Error if Firestore operation fails.
 */
export async function getUserAccount(uid: string): Promise<UserAccount | null> {
    console.log(`Attempting to get Firestore account for: ${uid}`);
    const usersCollection = getUsersCollection();
    const userRef = usersCollection.doc(uid);

    try {
        const userSnap = await userRef.get();

        if (userSnap.exists) {
            const userData = userSnap.data() as UserAccount;
            console.log(`Returning Firestore account for ${uid}:`, userData);
            return userData;
        } else {
            console.log(`User ${uid} not found in Firestore.`);
            // Optionally call ensureUserExists here if retrieval implies creation should happen
            // await ensureUserExists(uid);
            // const retrySnap = await userRef.get();
            // if (retrySnap.exists) return retrySnap.data() as UserAccount;
            return null; // Explicitly return null if not found after check
        }
    } catch (error) {
        console.error(`Error getting user account ${uid} from Firestore:`, error);
        throw new Error(`Failed to retrieve user account ${uid}.`);
    }
}

// Functions like updateUserDailyClickQuota, incrementUserReferralCount
// should now directly use Firestore updates (atomic increments etc.)
// For example:
export async function incrementUserClicks(uid: string): Promise<{ todayClicks: number; totalClicks: number }> {
    const usersCollection = getUsersCollection();
    const userRef = usersCollection.doc(uid);

    try {
        const updatedDoc = await db.runTransaction(async (transaction) => {
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists) {
                throw new Error(`User ${uid} not found for click increment.`);
            }
            const userData = userSnap.data() as UserAccount;

            // Check quota before incrementing
            if (userData.todayClicks >= userData.dailyQuota) {
                throw new Error("Daily quota exceeded.");
            }

            transaction.update(userRef, {
                todayClicks: FieldValue.increment(1),
                totalClicks: FieldValue.increment(1),
            });

            // Return the potentially updated values (after increment)
             return {
                 todayClicks: userData.todayClicks + 1,
                 totalClicks: userData.totalClicks + 1,
             };
        });

         console.log(`Incremented clicks for ${uid}. New counts: today=${updatedDoc.todayClicks}, total=${updatedDoc.totalClicks}`);
         return updatedDoc;

    } catch (error) {
        console.error(`Error incrementing clicks for ${uid}:`, error);
        if (error instanceof Error && error.message === "Daily quota exceeded.") {
             throw error; // Re-throw specific error for handling
        }
        throw new Error(`Failed to increment clicks for user ${uid}.`);
    }
}

// Placeholder for adding a reward to the user's array
export async function addUserReward(uid: string, reward: any): Promise<void> {
     const usersCollection = getUsersCollection();
     const userRef = usersCollection.doc(uid);
     try {
         await userRef.update({
             rewards: FieldValue.arrayUnion(reward) // Add reward atomically
         });
         console.log(`Added reward for user ${uid}:`, reward);
     } catch (error) {
         console.error(`Error adding reward for ${uid}:`, error);
         throw new Error(`Failed to add reward for user ${uid}.`);
     }
}

// Add other Firestore-based functions as needed (e.g., fetching leaderboard data)
