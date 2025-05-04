export interface RewardLevel {
  clicks: number; // Clicks needed to reach this reward (threshold)
  amount: number | string; // Reward amount or description
  type?: string; // Optional: type like 'cash', 'coupon' etc.
}

// Define the reward structure - MUST be in ascending order of clicks
export const REWARD_LEVELS: RewardLevel[] = [
  { clicks: 10000, amount: 20, type: 'cash' },
  { clicks: 20000, amount: 45, type: 'cash' },
  { clicks: 50000, amount: 100, type: 'cash' },
  { clicks: 100000, amount: 200, type: 'cash' },
  { clicks: 200000, amount: 500, type: 'cash' },
  // Add more levels as needed
];

// --- Helper Functions ---

function getRewardLevels(): RewardLevel[] {
     if (!REWARD_LEVELS || REWARD_LEVELS.length === 0) {
        console.warn("REWARD_LEVELS is empty or undefined. Returning empty array.");
        return [];
    }
    // Ensure levels are sorted by clicks ascending (important for logic)
    return [...REWARD_LEVELS].sort((a, b) => a.clicks - b.clicks);
}

/**
 * Determines the *next* reward target based on the current global click count.
 * It finds the first reward level whose click threshold is strictly greater
 * than the current global click count.
 *
 * @param globalClickCount The current total number of clicks globally.
 * @returns The RewardLevel representing the immediate next target, or a default/error state if none exist or levels are exhausted.
 */
export function getCurrentRewardTarget(globalClickCount: number): RewardLevel {
    const sortedLevels = getRewardLevels();

    if (sortedLevels.length === 0) {
        console.error("REWARD_LEVELS is empty. Cannot determine target.");
        // Return a sensible default or error state
        return { clicks: Infinity, amount: 0, type: 'error' };
    }

    // Find the first level where the required clicks are greater than the current count
    for (const level of sortedLevels) {
        if (globalClickCount < level.clicks) {
            return level; // This is the next target
        }
    }

    // If the current count is equal to or greater than the highest reward level,
    // it means all defined rewards have been passed or hit exactly.
    // In this scenario, the concept of a "next" target might be undefined
    // based on the current structure, or it could loop, or stop.
    // Current behavior: Indicate no further defined target.
    // You could modify this to loop back or define a post-max behavior.
    console.warn(`Global count ${globalClickCount} exceeds or matches the highest reward threshold (${sortedLevels[sortedLevels.length - 1].clicks}). No further target defined.`);
    return {
        clicks: Infinity, // Indicate no further target defined in current levels
        amount: 'N/A',
        type: 'ended' // Or 'looping' if you implement looping
    };

    // --- Looping Logic Example (If needed) ---
    /*
    const maxReward = sortedLevels[sortedLevels.length - 1];
    const minReward = sortedLevels[0];
    if (maxReward.clicks <= 0) { // Prevent division by zero
        console.error("Highest reward level has invalid clicks value.", maxReward);
        return { clicks: Infinity, amount: 0, type: 'error' };
    }
    // Calculate how many full cycles have passed (based on the highest threshold)
    const cycles = Math.floor(globalClickCount / maxReward.clicks);
    // Find the click count relative to the start of the *potential* next cycle
    const countInCycle = globalClickCount % maxReward.clicks;

    // Find the next target within the base levels, adjusted for cycles
    for (const level of sortedLevels) {
        if (countInCycle < level.clicks) {
            return {
                clicks: cycles * maxReward.clicks + level.clicks,
                amount: level.amount,
                type: level.type
            };
        }
    }
    // If countInCycle >= maxReward.clicks (just passed last reward), target min reward in *next* cycle
    return {
        clicks: (cycles + 1) * maxReward.clicks + minReward.clicks,
        amount: minReward.amount,
        type: minReward.type
    };
    */
}


// --- Deprecated/Removed Functions ---

// The concept of "Next Reward Level" after the current one is less relevant
// now that getCurrentRewardTarget directly gives the upcoming goal.
// export function getNextRewardLevel(globalClickCount: number): RewardLevel { ... }

// Daily quota calculation is now handled by the scheduled function default.
// export function calculateDailyQuota(currentRewardAmount: number): number { ... }

// Referral logic might be handled differently (e.g., direct Firestore updates)
// export function calculateReferralBonus(): number { ... }
// export const MAX_DAILY_REFERRAL_BONUS_COUNT = 3;
