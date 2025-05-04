// src/app/api/global/route.ts
import { NextResponse } from 'next/server';
import { getGlobalClickCount } from '@/services/reward';
import { getCurrentRewardTarget } from '@/lib/reward-logic';
import { isAdminSdkInitialized } from '@/lib/firebase/server'; // Import check

// Define the response structure
interface GlobalInfoResponse {
    totalClicks: number;
    nextRewardThreshold: number;
    nextRewardAmount: number | string;
}

export async function GET(request: Request) {
    // Check if Firebase Admin SDK is initialized first
    if (!isAdminSdkInitialized()) {
        console.error('Error in /api/global: Firebase Admin SDK is not initialized. Check server environment variables (FIREBASE_SERVICE_ACCOUNT_JSON).');
        return NextResponse.json({ error: 'Internal Server Error: Server configuration issue.' }, { status: 500 });
    }

    try {
        const globalClickCount = await getGlobalClickCount();
        const nextReward = getCurrentRewardTarget(globalClickCount); // getCurrentRewardTarget gives the *next* goal

        const response: GlobalInfoResponse = {
            totalClicks: globalClickCount,
            nextRewardThreshold: nextReward.clicks,
            nextRewardAmount: nextReward.amount,
        };

        return NextResponse.json(response, { status: 200 });

    } catch (error: any) {
        // Log the specific error for better debugging
        console.error('Error fetching global data in /api/global:', error);
        // Return a more generic error to the client, but log the details on the server
        return NextResponse.json({ error: 'Internal Server Error fetching global data. Please check server logs.' }, { status: 500 });
    }
}

// Optional: Implement caching if this endpoint is hit frequently
export const revalidate = 10; // Revalidate every 10 seconds (example)
