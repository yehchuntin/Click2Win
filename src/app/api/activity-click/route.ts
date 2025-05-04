// src/app/api/activity-click/route.ts
import { NextResponse } from 'next/server';
import {
    getActivityDefinition,
    incrementUserActivityClick,
    addUserReward // Reuse user reward function
} from '@/services/reward'; // Assuming activity logic is in reward service
import { ensureUserExists } from '@/services/account'; // To ensure user exists

// Define the expected request body structure
interface ActivityClickRequestBody {
    uid: string;
    activityId: string;
}

// Define the response structure
interface ActivityClickApiResponse {
    success: boolean;
    message?: string;
    error?: string;
    clicks?: number;      // User's clicks for this specific activity after increment
    completed?: boolean;  // Has the user completed the activity threshold?
    reward?: { type: string; amount: number | string } | null; // Reward details if *just* completed
}

export async function POST(request: Request) {
    try {
        const body: ActivityClickRequestBody = await request.json();
        const { uid, activityId } = body;

        if (!uid || !activityId) {
            return NextResponse.json({ success: false, error: 'User ID (uid) and Activity ID (activityId) are required.' }, { status: 400 });
        }

        // 1. Ensure user exists (optional but good practice)
        try {
            await ensureUserExists(uid);
        } catch (userError) {
            console.error(`Error ensuring user ${uid} exists for activity click:`, userError);
            // Don't necessarily fail the request, but log it
        }

        // 2. Get Activity Definition
        const activityDefinition = await getActivityDefinition(activityId);
        if (!activityDefinition) {
            return NextResponse.json({ success: false, error: `Activity ${activityId} not found.` }, { status: 404 });
        }

        // 3. Increment User's Activity Click Count (Handles creation/update)
        let updatedProgress;
        try {
             // Check if already completed *before* incrementing (optional, depends on desired behavior)
             // const currentProgress = await getUserActivityProgress(uid, activityId);
             // if (currentProgress?.completed) {
             //     return NextResponse.json({
             //        success: true, // Or false depending on if clicking completed task is ok
             //        message: "Activity already completed.",
             //        clicks: currentProgress.clicks,
             //        completed: true,
             //        reward: null
             //     }, { status: 200 });
             // }

            updatedProgress = await incrementUserActivityClick(uid, activityId, activityDefinition);
        } catch (error: any) {
            console.error(`Error incrementing activity click for ${uid} on ${activityId}:`, error);
            return NextResponse.json({ success: false, error: 'Failed to update activity progress.' }, { status: 500 });
        }


        // 4. Check if *this click* completed the activity and grant reward
        let rewardWon = null;
        let message = "Activity click recorded.";
        const justCompleted = updatedProgress.completed && updatedProgress.clicks === activityDefinition.clicksRequired; // Check if this click was the completing one

        if (justCompleted) {
            rewardWon = { type: activityDefinition.reward.type, amount: activityDefinition.reward.amount };
            message = `Congratulations! You completed the activity '${activityDefinition.name}' and earned a reward!`;
            console.log(`User ${uid} completed activity ${activityId}`);

            // Add reward to user's main reward list (or specific activity reward list)
            try {
                await addUserReward(uid, {
                    ...rewardWon,
                    activityId: activityId, // Add context
                    timestamp: new Date(),
                });
                // Optionally mark the activity reward as claimed in the progress doc
                // await markActivityRewardClaimed(uid, activityId);
            } catch (rewardError) {
                console.error(`Failed to add activity reward to user ${uid}'s record:`, rewardError);
                message += " (Error recording reward, please contact support if missing)";
            }
        }

        // 5. Prepare and send response
        const response: ActivityClickApiResponse = {
            success: true,
            message: message,
            clicks: updatedProgress.clicks,
            completed: updatedProgress.completed,
            reward: rewardWon, // Send reward details only if *just* won
        };

        return NextResponse.json(response, { status: 200 });

    } catch (error: any) {
        console.error('Error in /api/activity-click:', error);
         if (error instanceof SyntaxError) {
            return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
         }
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
