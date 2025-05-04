// src/app/api/activity/[id]/status/route.ts
import { NextResponse } from 'next/server';
import { getUserActivityProgress, getActivityDefinition, Reward } from '@/services/reward';

// Define the response structure
interface ActivityStatusResponse {
    uid: string;
    activityId: string;
    clicks: number;
    clicksRequired: number;
    completed: boolean;
    rewardClaimed: boolean; // Important to know if they got the reward
    activityName?: string; // Optional: Include activity name for context
    reward?: Reward | null; // Optional: Include reward details for context
}

interface RouteContext {
    params: {
        id: string; // Activity ID from the route segment
    };
}

export async function GET(request: Request, context: RouteContext) {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid'); // Get uid from query parameter
    const activityId = context.params.id; // Get activityId from route segment

    if (!uid) {
        return NextResponse.json({ error: 'User ID (uid) query parameter is required.' }, { status: 400 });
    }
    if (!activityId) {
         // Should be handled by Next.js routing if segment is missing, but check defensively
        return NextResponse.json({ error: 'Activity ID is missing in the route.' }, { status: 400 });
    }

    try {
        // 1. Get Activity Definition (to know clicksRequired and reward info)
        const activityDefinition = await getActivityDefinition(activityId);
        if (!activityDefinition) {
            return NextResponse.json({ error: `Activity ${activityId} not found.` }, { status: 404 });
        }

        // 2. Get User's Progress for this Activity
        const progress = await getUserActivityProgress(uid, activityId);

        // 3. Prepare Response
        let response: ActivityStatusResponse;
        if (progress) {
            response = {
                uid: progress.uid,
                activityId: progress.activityId,
                clicks: progress.clicks,
                clicksRequired: activityDefinition.clicksRequired,
                completed: progress.completed,
                rewardClaimed: progress.rewardClaimed || false, // Default to false if missing
                activityName: activityDefinition.name,
                reward: activityDefinition.reward,
            };
        } else {
            // User hasn't started this activity yet
            response = {
                uid: uid,
                activityId: activityId,
                clicks: 0,
                clicksRequired: activityDefinition.clicksRequired,
                completed: false,
                rewardClaimed: false,
                 activityName: activityDefinition.name,
                 reward: activityDefinition.reward,
            };
        }

        return NextResponse.json(response, { status: 200 });

    } catch (error: any) {
        console.error(`Error fetching activity status for user ${uid}, activity ${activityId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error fetching activity status.' }, { status: 500 });
    }
}

// Optional: Caching - might need to be user-specific or have short revalidation
// export const revalidate = 5; // Example: Revalidate every 5 seconds
