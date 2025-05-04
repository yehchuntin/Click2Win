export interface RewardLevel {
  clicks: number; // Clicks needed to reach this reward
  amount: number; // Reward amount in dollars (or points, etc.)
}

// Define the reward structure - ascending order of clicks
export const REWARD_LEVELS: RewardLevel[] = [
  { clicks: 100, amount: 5 },
  { clicks: 500, amount: 10 },
  { clicks: 1000, amount: 25 },
  { clicks: 5000, amount: 50 },
  { clicks: 10000, amount: 100 },
  // Add more levels as needed
];

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
  // Find the first reward level where the required clicks are greater than the current count
  for (const level of REWARD_LEVELS) {
    if (globalClickCount < level.clicks) {
      return level;
    }
  }
  // If all levels are passed, loop back to the minimum reward target.
  // The target becomes the *next* occurrence of the minimum reward click count.
  // Calculate how many full cycles have passed.
  const cycles = Math.floor(globalClickCount / MAX_REWARD.clicks);
  // Find the click count within the current cycle.
  const countInCycle = globalClickCount % MAX_REWARD.clicks;

   // Find the next applicable reward target within the cycle, or loop to the next cycle's minimum
  for (const level of REWARD_LEVELS) {
    if (countInCycle < level.clicks) {
       // Target is this level, but adjusted for the number of cycles passed
      return {
        clicks: cycles * MAX_REWARD.clicks + level.clicks,
        amount: level.amount
      };
    }
  }

  // If countInCycle is >= MAX_REWARD.clicks (shouldn't happen with modulo, but as fallback),
  // target the minimum reward in the *next* cycle.
   return {
     clicks: (cycles + 1) * MAX_REWARD.clicks + MIN_REWARD.clicks,
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
  const currentTarget = getCurrentRewardTarget(globalClickCount);

  // Find the index of the current target in the REWARD_LEVELS array
  const currentIndex = REWARD_LEVELS.findIndex(level => level.amount === currentTarget.amount && level.clicks % MAX_REWARD.clicks === currentTarget.clicks % MAX_REWARD.clicks );


  if (currentIndex === -1) {
     // Should not happen if currentTarget is valid, but fallback to minimum
     console.warn("Could not find current reward index, defaulting to minimum.");
     return getCurrentRewardTarget(globalClickCount); // Recalculate to be safe or return MIN adjusted
  }

  const nextIndex = (currentIndex + 1) % REWARD_LEVELS.length;
  const nextLevelBase = REWARD_LEVELS[nextIndex];

  // Calculate the correct click target considering cycles
  const baseTargetClicks = currentTarget.clicks;
  let nextTargetClicks: number;

  if (nextIndex === 0) { // We looped back to the minimum reward
      // Calculate the start of the next cycle
      const currentCycleEnd = Math.ceil(baseTargetClicks / MAX_REWARD.clicks) * MAX_REWARD.clicks;
       nextTargetClicks = currentCycleEnd + nextLevelBase.clicks;

       // Edge case: if baseTargetClicks is exactly MAX_REWARD.clicks
       if (baseTargetClicks % MAX_REWARD.clicks === 0 && baseTargetClicks > 0) {
         nextTargetClicks = baseTargetClicks + nextLevelBase.clicks;
       }


  } else {
      // Calculate the start of the current cycle
      const currentCycleStart = Math.floor((baseTargetClicks -1) / MAX_REWARD.clicks) * MAX_REWARD.clicks;
      nextTargetClicks = currentCycleStart + nextLevelBase.clicks;
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
