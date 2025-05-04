// src/app/api/click/route.ts
import { NextResponse } from 'next/server';
import { incrementUserClicks, getUserAccount, addUserReward } from '@/services/account';
import { incrementGlobalClickCount, getGlobalClickCount } from '@/services/reward';
import { getCurrentRewardTarget } from '@/lib/reward-logic';
import { REWARD_LEVELS } from '@/lib/reward-logic'; // Import reward levels for checking

// Define the expected request body structure
interface ClickRequestBody {
    uid: string;
}

// Define the response structure
interface ClickApiResponse {
    success: boolean;
    message?: string;
    error?: string;
    totalClicks?: number; // Global total clicks
    todayClicks?: number; // User's clicks today after this click
    reward?: { type: string; amount: number | string }; // Reward details if won
}

export async function POST(request: Request) {
    try {
        const body: ClickRequestBody = await request.json();
        const { uid } = body;

        if (!uid) {
            return NextResponse.json({ success: false, error: 'User ID (uid) is required.' }, { status: 400 });
        }

        // 1. Verify User and Quota (Transaction for safety)
        let userAccount;
        let globalClickCountBeforeIncrement;
        let incrementedUserClicksResult;

        try {
            // Fetch user account to check quota *before* incrementing anything
            userAccount = await getUserAccount(uid);
            if (!userAccount) {
                 return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
            }
            if (userAccount.todayClicks >= userAccount.dailyQuota) {
                return NextResponse.json({ success: false, error: 'Daily click quota exceeded.' }, { status: 429 });
            }

            // Get global count *before* potentially winning click
            globalClickCountBeforeIncrement = await getGlobalClickCount();

            // Increment user's clicks (today and total)
            // This function now internally checks quota again within its transaction for safety
            incrementedUserClicksResult = await incrementUserClicks(uid);

            // Increment global count *after* successfully incrementing user count
            await incrementGlobalClickCount();

        } catch (error: any) {
            console.error(`Error during click transaction validation for ${uid}:`, error);
            if (error.message === "Daily quota exceeded.") {
                 return NextResponse.json({ success: false, error: 'Daily click quota exceeded.' }, { status: 429 });
            }
             if (error.message.includes("User not found")) {
                 return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
             }
            return NextResponse.json({ success: false, error: 'Failed to process click due to server error.' }, { status: 500 });
        }

        // 2. Check for Reward Win
        const globalClickCountAfterIncrement = globalClickCountBeforeIncrement + 1; // Calculate the count that *this* click represents
        const currentRewardTarget = getCurrentRewardTarget(globalClickCountBeforeIncrement); // Target based on count *before* this click

        let rewardWon = null;
        let message = "Click recorded successfully.";

        // Check if this specific click hits the target
        if (globalClickCountAfterIncrement === currentRewardTarget.clicks) {
            rewardWon = { type: "cash", amount: currentRewardTarget.amount }; // Example reward type
            message = `Congratulations! You won $${currentRewardTarget.amount}!`;
            console.log(`User ${uid} won reward at click count ${globalClickCountAfterIncrement}`);
            // Add reward to user's record in Firestore
            try {
                await addUserReward(uid, {
                    ...rewardWon,
                    timestamp: new Date(), // Add timestamp to the reward
                    globalClickCount: globalClickCountAfterIncrement // Record the winning click number
                });
            } catch (rewardError) {
                console.error(`Failed to add reward to user ${uid}'s record:`, rewardError);
                // Decide how to handle this: Log it? Still return success but with a warning?
                // For now, log error but proceed with success response for the click itself
                message += " (Error recording reward, please contact support if missing)";
            }
        }

        // 3. Prepare and send response
        const response: ClickApiResponse = {
            success: true,
            message: message,
            totalClicks: globalClickCountAfterIncrement, // Return the updated global count
            todayClicks: incrementedUserClicksResult.todayClicks, // Return updated user clicks today
            ...(rewardWon && { reward: rewardWon }), // Include reward details if won
        };

        return NextResponse.json(response, { status: 200 });

    } catch (error: any) {
        console.error('Error in /api/click:', error);
         if (error instanceof SyntaxError) { // Handle JSON parsing errors
            return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
         }
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
