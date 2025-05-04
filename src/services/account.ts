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
  "test-user": {
    userId: "test-user",
    dailyClickQuota: 0, // Will be calculated dynamically
    referralCount: 2,
    referralsClaimedToday: 1,
  },
};
// ---------------------

/**
 * Simulates resetting daily quotas and referral claims at midnight.
 * In a real app, this would be a cron job or scheduled function.
 */
async function simulateDailyReset(userId: string): Promise<void> {
  if (MOCK_USER_DB[userId]) {
     // Recalculate quota based on current reward target
    const globalClickCount = await getGlobalClickCount(); // Fetch fresh count
    const currentReward = getCurrentRewardTarget(globalClickCount);
    MOCK_USER_DB[userId].dailyClickQuota = calculateDailyQuota(currentReward.amount);
    MOCK_USER_DB[userId].referralsClaimedToday = 0;
    console.log(`Simulated daily reset for ${userId}: Quota=${MOCK_USER_DB[userId].dailyClickQuota}`);
  }
}

/**
 * Asynchronously retrieves a user account by ID.
 * Simulates daily reset if the quota seems off (e.g., 0 when it shouldn't be).
 *
 * @param userId The ID of the user account to retrieve.
 * @returns A promise that resolves to a UserAccount object.
 */
export async function getUserAccount(userId: string): Promise<UserAccount> {
  console.log(`Attempting to get account for: ${userId}`);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 50));

  // Simulate daily reset check (in a real app, rely on backend logic/cron jobs)
  // Basic check: If quota is 0, maybe it needs a reset (crude simulation)
  if (MOCK_USER_DB[userId] && MOCK_USER_DB[userId].dailyClickQuota <= 0) {
     // Check if a reset might be needed. THIS IS VERY SIMPLISTIC.
     // A real app tracks the last reset time.
     console.log(`Quota is 0 for ${userId}, simulating potential daily reset...`);
     await simulateDailyReset(userId); // This updates the mock DB directly
  } else if (!MOCK_USER_DB[userId]) {
      console.log(`User ${userId} not found, creating default entry.`);
      // Create a default user if not found
      MOCK_USER_DB[userId] = {
          userId: userId,
          dailyClickQuota: 0, // Reset will calculate this
          referralCount: 0,
          referralsClaimedToday: 0,
      };
      await simulateDailyReset(userId); // Calculate initial quota
  }


  console.log("Current Mock DB state:", MOCK_USER_DB);


  if (MOCK_USER_DB[userId]) {
     console.log(`Returning account for ${userId}:`, MOCK_USER_DB[userId]);
    return { ...MOCK_USER_DB[userId] }; // Return a copy
  } else {
     // This case should technically be handled by the creation logic above
    throw new Error(`User account not found for userId: ${userId}`);
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

  if (MOCK_USER_DB[userId]) {
    MOCK_USER_DB[userId].dailyClickQuota = Math.max(0, newQuota); // Ensure quota doesn't go below 0
    console.log(`Updated quota for ${userId} to ${MOCK_USER_DB[userId].dailyClickQuota}`);
  } else {
    console.warn(`User not found, cannot update quota for ${userId}`);
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
    console.warn(`User not found, cannot increment referral count for ${userId}`);
    // Optionally throw an error
  }
  return;
}
