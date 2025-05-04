// src/app/api/global/route.ts
import { NextResponse } from 'next/server';
import { getGlobalClickCount } from '@/services/reward';
import { getCurrentRewardTarget } from '@/lib/reward-logic';

// Define the response structure
interface GlobalInfoResponse {
    totalClicks: number;
    nextRewardThreshold: number;
    nextRewardAmount: number | string;
}

export async function GET(request: Request) {
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
        console.error('Error in /api/global:', error);
        return NextResponse.json({ error: 'Internal Server Error fetching global data' }, { status: 500 });
    }
}

// Optional: Implement caching if this endpoint is hit frequently
export const revalidate = 10; // Revalidate every 10 seconds (example)
