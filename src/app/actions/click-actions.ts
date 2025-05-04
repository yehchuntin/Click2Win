"use server";

import { revalidatePath } from 'next/cache';
import {
  getUserAccount,
  updateUserDailyClickQuota,
  // incrementUserReferralCount, // Keep if referral logic is added here later
} from "@/services/account";
import {
  getGlobalClickCount,
  incrementGlobalClickCount,
} from "@/services/reward";
import { getCurrentRewardTarget, getNextRewardLevel } from '@/lib/reward-logic';

interface ClickActionResult {
  success: boolean;
  message?: string;
  error?: string;
  newQuota?: number;
  newGlobalCount?: number;
  rewardWon?: number;
}

// Placeholder for actual user authentication/identification
async function getCurrentUserId(): Promise<string> {
  // In a real app, get this from session, auth context, etc.
  return "test-user";
}

export async function handleClickAction(): Promise<ClickActionResult> {
  const userId = await getCurrentUserId();

  try {
    // 1. Fetch current user and global state
    const [userAccount, globalClickCount] = await Promise.all([
      getUserAccount(userId),
      getGlobalClickCount(),
    ]);

    // 2. Check User's Quota
    if (userAccount.dailyClickQuota <= 0) {
      return { success: false, error: "用戶每日點擊次數已用完 (User daily click quota exhausted)." };
    }

    // 3. Decrement user quota and increment global count (atomically if possible)
    //    Ideally, these updates happen in a transaction in a real backend.
    const newQuota = userAccount.dailyClickQuota - 1;
    const newGlobalCount = globalClickCount + 1;

    await Promise.all([
      updateUserDailyClickQuota(userId, newQuota),
      incrementGlobalClickCount(), // This increments the count in the backend
    ]);


    // 4. Check for Reward
    const currentReward = getCurrentRewardTarget(globalClickCount); // Check based on count *before* this click
    let rewardWon = 0;
    let message = "點擊已記錄 (Click recorded).";

    if (newGlobalCount === currentReward.clicks) {
        rewardWon = currentReward.amount;
        message = `恭喜！您贏得了 $${rewardWon}! (Congratulations! You won $${rewardWon}!)`;
        // TODO: Implement reward crediting logic here (e.g., update user balance)

        // Since the reward was won, potentially reset or cycle the reward target
        // This depends on the exact reward logic (reset to 0, move to next level, etc.)
        // For simplicity, we'll assume it just moves on. The `getCurrentRewardTarget`
        // called on the next page load will reflect the state based on the *new* global count.

    } else {
       const nextReward = getCurrentRewardTarget(newGlobalCount); // Get info for the *next* potential reward
       const clicksRemaining = nextReward.clicks - newGlobalCount;
       message = `點擊已記錄。距離下次獎勵 $${nextReward.amount} 還差 ${clicksRemaining} 次點擊。 (Click recorded. ${clicksRemaining} clicks remaining for the next reward of $${nextReward.amount}.)`;
    }


    // 5. Revalidate the path to update the UI for all users
    revalidatePath('/');

    // 6. Return success
    return {
      success: true,
      message: message,
      newQuota: newQuota,
      newGlobalCount: newGlobalCount, // Return the updated count
      rewardWon: rewardWon > 0 ? rewardWon : undefined,
    };

  } catch (error) {
    console.error("Error handling click action:", error);
    return {
      success: false,
      error: "處理點擊時發生伺服器錯誤 (Server error processing click).",
    };
  }
}


// TODO: Add server action for handling referrals if needed
// export async function handleReferralAction(referrerId: string, referredUserId: string): Promise<ActionResult> { ... }
