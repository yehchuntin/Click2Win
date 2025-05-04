export interface RewardLevel {
  clicks: number; // Clicks needed to reach this reward
  amount: number; // Reward amount in dollars (or points, etc.)
}

// Define the reward structure - ascending order of clicks
export const REWARD_LEVELS: RewardLevel[] = [
  { clicks: 10000, amount: 20 },
  { clicks: 20000, amount: 45 },
  { clicks: 50000, amount: 100 },
  { clicks: 100000, amount: 200 },
  { clicks: 200000, amount: 500 },
  // Add more levels as needed
];

// Ensure these are updated if REWARD_LEVELS changes significantly
const MIN_REWARD = REWARD_LEVELS[0];
const MAX_REWARD = REWARD_LEVELS[REWARD_LEVELS.length - 1];

/**
 * Determines the current reward target based on the global click count.
 * If the current count exceeds the highest reward level, it loops back to the lowest.
 *
 * @param globalClickCount The current total number of clicks globally.
 * @returns The RewardLevel representing the current target.
 */
export function getCurrentRewardTarget(globalClickCount: number): RewardLevel {
    if (REWARD_LEVELS.length === 0) {
        console.error("REWARD_LEVELS is empty. Cannot determine target.");
        return { clicks: Infinity, amount: 0 }; // Or some default/error state
    }

  // Find the first reward level where the required clicks are greater than the current count
  for (const level of REWARD_LEVELS) {
    if (globalClickCount < level.clicks) {
      return level;
    }
  }

  // If all levels are passed, loop back based on the highest reward click count.
  const maxRewardClicks = MAX_REWARD.clicks;
  if (maxRewardClicks <= 0) {
      console.error("MAX_REWARD has invalid clicks value. Cannot loop.", MAX_REWARD);
      // Fallback: Target the next lowest reward level hypothetically
      return { clicks: globalClickCount + (REWARD_LEVELS[0]?.clicks || 100), amount: REWARD_LEVELS[0]?.amount || 5 };
  }


  // Calculate how many full cycles of the *entire* reward structure have passed.
  const cycles = Math.floor(globalClickCount / maxRewardClicks);
  // Find the click count relative to the start of the *potential* next cycle.
  const countInCycle = globalClickCount % maxRewardClicks;

   // Find the next applicable reward target within the base levels, or loop to the next cycle's minimum
  for (const level of REWARD_LEVELS) {
    // If the count within the current cycle progression is less than this level's base clicks,
    // then this level is the next target, adjusted for the completed cycles.
    if (countInCycle < level.clicks) {
      return {
        clicks: cycles * maxRewardClicks + level.clicks,
        amount: level.amount
      };
    }
  }

  // If countInCycle is >= maxRewardClicks (meaning we just hit or passed the last reward),
  // target the minimum reward in the *next* cycle.
   return {
     clicks: (cycles + 1) * maxRewardClicks + MIN_REWARD.clicks,
     amount: MIN_REWARD.amount
   };
}


/**
 * Gets the next reward level details after the current global click count.
 * Handles looping back to the minimum reward after the maximum is reached.
 *
 * @param globalClickCount The current global click count.
 * @returns The next RewardLevel.
 */
export function getNextRewardLevel(globalClickCount: number): RewardLevel {
    if (REWARD_LEVELS.length === 0) {
        console.error("REWARD_LEVELS is empty. Cannot determine next level.");
        return { clicks: Infinity, amount: 0 };
    }

    const currentTarget = getCurrentRewardTarget(globalClickCount);
    const maxRewardClicks = MAX_REWARD.clicks;

    if (maxRewardClicks <= 0) {
         console.error("MAX_REWARD has invalid clicks value. Cannot get next level.", MAX_REWARD);
         return currentTarget; // Return current as fallback
    }

    // Find the index of the *base* reward level corresponding to the current target's amount and relative click position
    const currentTargetClicksInCycle = currentTarget.clicks % maxRewardClicks || maxRewardClicks; // Handle case where clicks is multiple of maxRewardClicks
    const currentIndex = REWARD_LEVELS.findIndex(level => level.clicks === currentTargetClicksInCycle);

    if (currentIndex === -1) {
        // This might happen if currentTarget.clicks is not aligned with base levels (e.g., mid-cycle)
        // Or if the current target calculation resulted in something unexpected.
        console.warn(`Could not find current reward index for target ${currentTarget.clicks}. Recalculating base.`);
        // Find the base level just below or equal to the count in cycle
        const countInCycle = globalClickCount % maxRewardClicks;
        let baseIndex = REWARD_LEVELS.length - 1;
        for (let i = 0; i < REWARD_LEVELS.length; i++) {
            if (countInCycle < REWARD_LEVELS[i].clicks) {
                baseIndex = (i === 0 ? REWARD_LEVELS.length - 1 : i - 1);
                break;
            }
        }
        const nextIndex = (baseIndex + 1) % REWARD_LEVELS.length;
        const nextLevelBase = REWARD_LEVELS[nextIndex];
        const cycles = Math.floor(globalClickCount / maxRewardClicks);
         const nextTargetClicks = (nextIndex === 0 ? (cycles + 1) : cycles) * maxRewardClicks + nextLevelBase.clicks;

        return {
             clicks: nextTargetClicks,
             amount: nextLevelBase.amount,
        };
    }

    const nextIndex = (currentIndex + 1) % REWARD_LEVELS.length;
    const nextLevelBase = REWARD_LEVELS[nextIndex];

    // Calculate the correct click target considering cycles
    const baseTargetClicks = currentTarget.clicks;
    let nextTargetClicks: number;

    // Determine the cycle number based on the *current* target
    const currentCycle = Math.floor((baseTargetClicks - 1) / maxRewardClicks);


    if (nextIndex === 0) { // We looped back to the minimum reward
        // Target is the base clicks of the next level in the *next* cycle
        nextTargetClicks = (currentCycle + 1) * maxRewardClicks + nextLevelBase.clicks;
    } else {
       // Target is the base clicks of the next level in the *current* cycle
       nextTargetClicks = currentCycle * maxRewardClicks + nextLevelBase.clicks;
    }


    return {
        clicks: nextTargetClicks,
        amount: nextLevelBase.amount,
    };
}


/**
 * Calculates the daily click quota based on the reward amount.
 * This is a placeholder function; the logic might need adjustment.
 * Example: Higher reward target might grant more clicks, or it could be fixed.
 *
 * @param currentRewardAmount The amount of the current reward being targeted.
 * @returns The number of daily clicks allowed for a user.
 */
export function calculateDailyQuota(currentRewardAmount: number): number {
  // Example logic: Fixed quota for now, could be based on rewardAmount
  // if (currentRewardAmount >= 100) return 20;
  // if (currentRewardAmount >= 50) return 15;
  return 10; // Default fixed quota
}

/**
 * Calculates the bonus clicks granted for a referral.
 *
 * @returns The number of bonus clicks.
 */
export function calculateReferralBonus(): number {
  return 5; // Fixed bonus clicks per referral
}

/**
 * Defines the maximum number of referral bonuses a user can get per day.
 */
export const MAX_DAILY_REFERRAL_BONUS_COUNT = 3; // e.g., max 3 successful referrals grant bonus clicks per day
