import { calculateDailyQuota, MAX_DAILY_REFERRAL_BONUS_COUNT, calculateReferralBonus } from "@/lib/reward-logic";
import { getGlobalClickCount } from "./reward";
import { getCurrentRewardTarget } from "@/lib/reward-logic";

/**
 * Represents a user account with necessary information for click tracking and rewards.
 */
export interface UserAccount {
  /**
   * The unique identifier for the user.
   */
  userId: string;
  /**
   * The number of remaining clicks available to the user today.
   */
  dailyClickQuota: number;
  /**
   * The total number of referrals the user has made.
   */
  referralCount: number;
   /**
    * The number of referral bonuses claimed today.
    */
   referralsClaimedToday: number;
}

// --- Mock Database ---
// In a real app, this would be Firestore, Supabase, etc.
const MOCK_USER_DB: Record<string, UserAccount> = {
  "test-user": { // Pre-existing test user
    userId: "test-user",
    dailyClickQuota: 0, // Will be calculated dynamically
    referralCount: 2,
    referralsClaimedToday: 1,
  },
};
// ---------------------

// Track last reset time (simple in-memory version)
const lastResetTimes: Record<string, number> = {}; // Stores last reset timestamp (ms) per user

/**
 * Simulates resetting daily quotas and referral claims at midnight.
 * In a real app, this would be a cron job or scheduled function.
 */
async function simulateDailyReset(userId: string, forceReset = false): Promise<void> {
    const now = Date.now();
    const lastReset = lastResetTimes[userId] || 0;
    const todayStart = new Date().setHours(0, 0, 0, 0); // Timestamp for start of today

    // Reset if it's a new day or forceReset is true
    if (forceReset || lastReset < todayStart) {
        if (MOCK_USER_DB[userId]) {
            // Recalculate quota based on current reward target
            const globalClickCount = await getGlobalClickCount(); // Fetch fresh count
            const currentReward = getCurrentRewardTarget(globalClickCount);
            MOCK_USER_DB[userId].dailyClickQuota = calculateDailyQuota(currentReward.amount);
            MOCK_USER_DB[userId].referralsClaimedToday = 0;
            lastResetTimes[userId] = now; // Update last reset time
            console.log(`Simulated daily reset for ${userId}: Quota=${MOCK_USER_DB[userId].dailyClickQuota}`);
        }
    }
}

/**
 * Ensures a user exists in the database, creating a default entry if not.
 * This is often called after a successful sign-in.
 *
 * @param userId The ID of the user to check/create.
 * @returns A promise that resolves when the user exists.
 */
export async function ensureUserExists(userId: string): Promise<void> {
    if (!MOCK_USER_DB[userId]) {
        console.log(`User ${userId} not found, creating default entry.`);
        MOCK_USER_DB[userId] = {
            userId: userId,
            dailyClickQuota: 0, // Will be set by simulateDailyReset
            referralCount: 0,
            referralsClaimedToday: 0,
        };
        await simulateDailyReset(userId, true); // Force initial calculation
    }
    // If user already exists, ensure their daily state is up-to-date
    else {
        await simulateDailyReset(userId);
    }
}


/**
 * Asynchronously retrieves a user account by ID.
 * Ensures daily state is updated before returning.
 *
 * @param userId The ID of the user account to retrieve.
 * @returns A promise that resolves to a UserAccount object.
 * @throws Error if the user cannot be found or created.
 */
export async function getUserAccount(userId: string): Promise<UserAccount> {
  console.log(`Attempting to get account for: ${userId}`);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 50));

  // Ensure user exists and daily state is updated
  await ensureUserExists(userId);

  console.log("Current Mock DB state:", MOCK_USER_DB);

  if (MOCK_USER_DB[userId]) {
     console.log(`Returning account for ${userId}:`, MOCK_USER_DB[userId]);
    return { ...MOCK_USER_DB[userId] }; // Return a copy
  } else {
    // This should ideally not happen due to ensureUserExists, but handle defensively
    console.error(`Failed to find or create user account for userId: ${userId}`);
    throw new Error(`User account could not be retrieved for userId: ${userId}`);
  }
}

/**
 * Asynchronously updates a user's daily click quota.
 *
 * @param userId The ID of the user account to update.
 * @param newQuota The new daily click quota for the user.
 * @returns A promise that resolves when the quota is updated.
 */
export async function updateUserDailyClickQuota(userId: string, newQuota: number): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 30));

  // Ensure user exists before updating
  await ensureUserExists(userId);

  if (MOCK_USER_DB[userId]) {
    MOCK_USER_DB[userId].dailyClickQuota = Math.max(0, newQuota); // Ensure quota doesn't go below 0
    console.log(`Updated quota for ${userId} to ${MOCK_USER_DB[userId].dailyClickQuota}`);
  } else {
    console.warn(`User not found after ensure check, cannot update quota for ${userId}`);
    // Optionally throw an error
  }
  return;
}

/**
 * Asynchronously increments a user's referral count and potentially grants bonus clicks.
 *
 * @param userId The ID of the user account (the referrer) to update.
 * @returns A promise that resolves when the referral count is incremented.
 */
export async function incrementUserReferralCount(userId: string): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 40));

  // Ensure user exists before updating
  await ensureUserExists(userId);

  if (MOCK_USER_DB[userId]) {
    MOCK_USER_DB[userId].referralCount += 1;

    // Check if daily referral bonus limit is reached
    if (MOCK_USER_DB[userId].referralsClaimedToday < MAX_DAILY_REFERRAL_BONUS_COUNT) {
      const bonusClicks = calculateReferralBonus();
      MOCK_USER_DB[userId].dailyClickQuota += bonusClicks;
      MOCK_USER_DB[userId].referralsClaimedToday += 1;
      console.log(`Incremented referral count for ${userId} to ${MOCK_USER_DB[userId].referralCount}. Granted ${bonusClicks} bonus clicks. Quota now: ${MOCK_USER_DB[userId].dailyClickQuota}. Referrals claimed today: ${MOCK_USER_DB[userId].referralsClaimedToday}`);
    } else {
       console.log(`Incremented referral count for ${userId} to ${MOCK_USER_DB[userId].referralCount}. Daily bonus limit reached, no extra clicks granted.`);
    }

  } else {
    console.warn(`User not found after ensure check, cannot increment referral count for ${userId}`);
    // Optionally throw an error
  }
  return;
}
