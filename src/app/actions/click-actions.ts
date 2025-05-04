"use server";

import { revalidatePath } from 'next/cache';
import {
  getUserAccount,
  updateUserDailyClickQuota,
  // ensureUserExists, // Removed ensureUserExists as it's not defined in service
  // incrementUserReferralCount, // Keep if referral logic is added here later
} from "@/services/account";
import {
  getGlobalClickCount,
  incrementGlobalClickCount,
} from "@/services/reward";
import { getCurrentRewardTarget } from '@/lib/reward-logic';
import { auth, isAdminSdkInitialized } from '@/lib/firebase/server'; // Import server auth and initialization check

// Export the result type
export interface ClickActionResult {
  success: boolean;
  message?: string;
  error?: string;
  newQuota?: number;
  newGlobalCount?: number;
  rewardWon?: number;
}

// Get current user ID from server-side authentication
async function getCurrentUserId(): Promise<string | null> {
    // Check if Firebase Admin SDK is initialized
    if (!isAdminSdkInitialized() || !auth) {
        console.error("Firebase Server Auth not initialized.");
        return null;
    }
    try {
        // Server-side auth doesn't have a direct equivalent of client-side `onAuthStateChanged`.
        // We typically rely on session cookies or ID tokens passed from the client
        // and verify them on the server. This setup is more complex and usually involves middleware.
        //
        // For this example, we'll assume a simplified (and insecure) direct user ID access
        // or handle the case where auth is not available/user is not found.
        // A proper implementation would verify a token here.

        // Placeholder: In a real app, you'd verify an ID token or session cookie.
        // For now, we return a hardcoded ID for testing or handle null if auth isn't ready.
        // Replace 'test-user-server' with actual logic when auth flow is complete.
        // const decodedToken = await auth.verifyIdToken(idToken); // Example verification
        // return decodedToken.uid;

        // Since we don't have token verification setup, we cannot reliably get the current user server-side this way.
        // Returning null to indicate authentication cannot be confirmed server-side without more setup.
        // We will need to pass the userId explicitly to this action from the client component that calls it
        // after confirming the user is logged in on the client.

        console.warn("Server-side user detection in this action is simplified. Pass userId from client.");
        return null; // Or return a test ID if needed for isolated testing: 'test-user-server';


    } catch (error) {
        console.error("Error getting current user server-side:", error);
        return null;
    }
}

// IMPORTANT: Modify this action to accept userId as a parameter
export async function handleClickAction(userId: string | null): Promise<ClickActionResult> {
  // const userId = await getCurrentUserId(); // We now receive userId as a parameter

  if (!userId) {
      return { success: false, error: "用戶未認證或無法確認。(User not authenticated or could not be verified.)" };
  }

  try {
    // Optional: Ensure user exists in our backend database if needed
    // await ensureUserExists(userId); // Creates user if not found

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
    let message = "點擊已記錄 (Click recorded)."; // Default message

    if (newGlobalCount === currentReward.clicks) {
        rewardWon = currentReward.amount;
        message = `恭喜！您贏得了 $${rewardWon}! (Congratulations! You won $${rewardWon}!)`;
        // TODO: Implement reward crediting logic here (e.g., update user balance)

        // Since the reward was won, potentially reset or cycle the reward target
        // This depends on the exact reward logic (reset to 0, move to next level, etc.)
        // For simplicity, we'll assume it just moves on. The `getCurrentRewardTarget`
        // called on the next page load will reflect the state based on the *new* global count.

    }
    // No "else" message needed if we only want winner messages/toasts

    // 5. Revalidate the path to update the UI for all users
    revalidatePath('/');

    // 6. Return success
    return {
      success: true,
      message: message, // Pass the message even if it's just "Click recorded" or the win message
      newQuota: newQuota,
      newGlobalCount: newGlobalCount, // Return the updated count
      rewardWon: rewardWon > 0 ? rewardWon : undefined,
    };

  } catch (error) {
    console.error("Error handling click action:", error);
    let errorMessage = "處理點擊時發生伺服器錯誤 (Server error processing click).";
    if (error instanceof Error) {
       errorMessage = error.message; // Use more specific error if available
    }
    return {
      success: false,
      error: errorMessage,
    };
  }
}


// TODO: Add server action for handling referrals if needed
// export async function handleReferralAction(referrerId: string, referredUserId: string): Promise<ActionResult> { ... }
