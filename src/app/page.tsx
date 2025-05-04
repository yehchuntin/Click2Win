'use client';

import { ClickButton } from "@/components/click-button";
import { GlobalInfoDisplay } from "@/components/global-info-display";
import { UserInfoDisplay } from "@/components/user-info-display";
import { Separator } from "@/components/ui/separator";
import { getUserAccount } from "@/services/account";
import { getGlobalClickCount } from "@/services/reward";
import { getCurrentRewardTarget } from "@/lib/reward-logic";
import { BonusButton } from "@/components/bonus-button";
import { useState, useEffect } from 'react';
import { SponsorActivityArea } from '@/components/home/sponsor-activity-area'; // Import Sponsor Activity Area
import { BottomNavBar } from '@/components/layout/bottom-nav-bar'; // Import Bottom Navigation Bar
import type { UserAccount } from '@/services/account'; // Import UserAccount type

interface HomePageContentProps {
    initialUserAccount: UserAccount | null; // Allow null for logged out state
    initialGlobalClickCount: number;
}


// New Client Component for the main content
function HomePageContent({ initialUserAccount, initialGlobalClickCount }: HomePageContentProps) {
    const currentRewardTarget = getCurrentRewardTarget(initialGlobalClickCount);
    const [userClicks, setUserClicks] = useState(0); // Example state for task tracking
    // Use state for user account and global count to allow updates
    const [userAccount, setUserAccount] = useState(initialUserAccount);
    const [globalClickCount, setGlobalClickCount] = useState(initialGlobalClickCount);

    // Effect to update local state if props change (e.g., after login/refresh)
    useEffect(() => {
        setUserAccount(initialUserAccount);
        setGlobalClickCount(initialGlobalClickCount);
    }, [initialUserAccount, initialGlobalClickCount]);

    const handleRewardClaimed = () => {
        // This would ideally refresh the user's account data to update quotas etc.
        // For now, just log it. In a real app, call a server action or refetch.
        console.log("Reward claimed, potentially update user state here!");
        // You might want to refetch userAccount here
    };

    // Determine initial quota, handling null userAccount
    const initialQuota = userAccount ? userAccount.dailyClickQuota : 0;

    return (
        <div className="flex flex-col min-h-screen"> {/* Make container full height */}
            <div className="flex-1 container flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 lg:pb-24 pt-8"> {/* Adjust padding, remove lg:p-24 */}
                {/* Sponsor Activity Area */}
                <SponsorActivityArea />

                 <Separator className="my-6 md:my-8 w-full max-w-4xl" />

                {/* Main Game Area */}
                <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8">
                    {/* Moved Title */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-center text-primary-foreground mb-6">
                        Click<span className="text-primary">2</span>Win
                    </h1>

                    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                       {userAccount ? (
                            <UserInfoDisplay
                                dailyClickQuota={userAccount.dailyClickQuota}
                                referralCount={userAccount.referralCount}
                            />
                        ) : (
                           <div className="md:col-span-1 flex items-center justify-center text-muted-foreground">請先登入 (Please Log In)</div>
                        )}

                        <Separator orientation="vertical" className="hidden md:block mx-auto h-auto" />
                        <Separator orientation="horizontal" className="block md:hidden my-4 w-full" />

                         <GlobalInfoDisplay
                            globalClickCount={globalClickCount}
                            rewardTarget={currentRewardTarget.clicks}
                            rewardAmount={currentRewardTarget.amount}
                         />
                    </div>

                    <Separator className="my-6 md:my-8 w-full max-w-lg" />

                     {/* Only show click button if logged in */}
                    {userAccount ? (
                        <ClickButton initialQuota={initialQuota} />
                    ) : (
                        <p className="text-accent-foreground">登入後即可開始點擊！(Log in to start clicking!)</p>
                    )}


                     {/* Bonus Button Example - Conditionally render or disable if not logged in */}
                    <div className="mt-8">
                        <BonusButton
                            type="task"
                            rewardAmount={50}
                            clicksRequired={100}
                            userClicks={userClicks} // Pass dynamic user clicks state if needed
                            onRewardClaimed={handleRewardClaimed}
                            disabled={!userAccount} // Disable if not logged in
                        />
                     </div>


                    <p className="text-xs text-muted-foreground mt-8 text-center max-w-md">
                        點擊按鈕！當全球點擊次數達到目標時，幸運的點擊者將贏得獎勵。每人每天有固定的點擊次數，分享給朋友可以獲得額外次數！
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 text-center max-w-md">
                        Click the button! When the global click count reaches the target, the lucky clicker wins the reward. Everyone has a daily click limit, and referring friends grants extra clicks!
                    </p>
                </div>
            </div>

            {/* Bottom Navigation Bar */}
            <BottomNavBar />
        </div>
    );
}

// Server Component remains to fetch initial data
export default async function Home() {
    // Fetch initial data on the server
    // TODO: Replace 'test-user' with the actual logged-in user ID from auth state
    // This needs proper integration. For now, we might get null if not logged in.
    const userId = 'test-user'; // Replace with actual auth logic
    let userAccount = null;
    try {
        // Assume getUserAccount handles non-existent users gracefully or we check auth status first
        // This needs real auth integration to get the *actual* current user ID
        // For demo, we'll fetch 'test-user', but in reality, check session/token
        // If no user is logged in, userId would be null/undefined.
        // getUserAccount should handle this case or return null.
         userAccount = await getUserAccount(userId); // Needs adjustment based on actual auth state
    } catch (error) {
       console.warn("Could not fetch user account, proceeding as logged out:", error);
       // User might not exist or an error occurred, treat as logged out
       userAccount = null;
    }

    const globalClickCount = await getGlobalClickCount();


    return (
        <HomePageContent initialUserAccount={userAccount} initialGlobalClickCount={globalClickCount} />
    );
}
