
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
import type { ClickActionResult } from '@/app/actions/click-actions'; // Import action result type
import { useAuth } from "@/hooks/use-auth"; // Import useAuth hook
import { Loader2 } from "lucide-react"; // Import Loader

// Interface for props passed *from* the server component wrapper (if any)
// For this fully client component, initial data fetching happens client-side
// interface HomePageProps {
//     initialGlobalClickCount: number; // Example if global count fetched server-side
// }

// Client Component for the main content and data fetching
export default function Home() {
    const { user, loading: authLoading } = useAuth(); // Get user and loading state
    const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
    const [globalClickCount, setGlobalClickCount] = useState<number | null>(null); // Initialize as null
    const [userClicksForTask, setUserClicksForTask] = useState(0); // Example state for task tracking
    const [loadingData, setLoadingData] = useState(true); // State for data loading

    // Fetch initial data on component mount or when user changes
    useEffect(() => {
        async function fetchData() {
            setLoadingData(true); // Start loading data
            try {
                // Fetch global count regardless of auth state
                const globalCount = await getGlobalClickCount();
                setGlobalClickCount(globalCount);

                // Fetch user account only if logged in
                if (user) {
                    console.log("Fetching user account for:", user.uid);
                    const account = await getUserAccount(user.uid);
                    setUserAccount(account);
                    // Potentially set initial userClicksForTask based on account data if stored
                } else {
                    setUserAccount(null); // Clear account if logged out
                }
            } catch (error) {
                console.error("Error fetching initial data:", error);
                // Optionally set error state or show toast
            } finally {
                setLoadingData(false); // Finish loading data
            }
        }

        // Only fetch data when auth loading is finished
        if (!authLoading) {
             fetchData();
        }

    }, [user, authLoading]); // Depend on user and authLoading state

    const currentRewardTarget = globalClickCount !== null
        ? getCurrentRewardTarget(globalClickCount)
        : { clicks: 0, amount: 0 }; // Default if global count not loaded

    const handleRewardClaimed = async () => {
        console.log("Reward claimed, refetching user state...");
        if (user) {
            try {
                const updatedAccount = await getUserAccount(user.uid);
                setUserAccount(updatedAccount);
            } catch (error) {
                console.error("Error refetching user account after reward claim:", error);
            }
        }
    };

    // Callback for ClickButton to update state after a successful click
    const handleSuccessfulClick = (result: ClickActionResult) => {
        if (result.success) {
            // Update user account state if it exists and quota is returned
            if (userAccount && result.newQuota !== undefined) {
                setUserAccount(prev => prev ? { ...prev, dailyClickQuota: result.newQuota! } : null);
            }
            // Update global click count state if returned
            if (result.newGlobalCount !== undefined) {
                setGlobalClickCount(result.newGlobalCount);
            }
             // Increment task clicks locally for demonstration
             setUserClicksForTask(prev => prev + 1);
        }
        // Error handling or specific messages are handled by the toast in ClickButton/action
    };

    // Determine current quota, handling null userAccount
    const currentQuota = userAccount ? userAccount.dailyClickQuota : 0;

    // Show loading spinner if auth or data is loading
    if (authLoading || loadingData) {
        return (
            <div className="flex min-h-[calc(100vh-var(--header-height)-var(--footer-height))] items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }


    return (
        <div className="flex flex-col min-h-screen"> {/* Make container full height */}
            <div className="flex-1 container flex flex-col items-center p-4 sm:p-8 md:p-12 lg:pb-24 pt-8"> {/* Adjust padding */}
                {/* Sponsor Activity Area */}
                <SponsorActivityArea />

                 <Separator className="my-6 md:my-8 w-full max-w-4xl" />

                {/* Main Game Area */}
                <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8">
                    {/* Moved Title */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-center text-primary-foreground mb-6">
                        Click<span className="text-primary">2</span>Win
                    </h1>

                    {/* Display global info and user info only when data is loaded */}
                    {globalClickCount !== null && (
                        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                            {user ? (
                                userAccount ? (
                                    <UserInfoDisplay
                                        dailyClickQuota={userAccount.dailyClickQuota} // Use state value
                                        referralCount={userAccount.referralCount}
                                    />
                                ) : (
                                     // Still loading user account specifically
                                     <div className="md:col-span-1 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
                                )
                            ) : (
                            <div className="md:col-span-1 flex items-center justify-center text-muted-foreground p-4 bg-card/50 rounded-lg border border-border/30">請先登入 (Please Log In)</div>
                            )}

                            <Separator orientation="vertical" className="hidden md:block mx-auto h-auto" />
                            <Separator orientation="horizontal" className="block md:hidden my-4 w-full" />

                            <GlobalInfoDisplay
                                globalClickCount={globalClickCount} // Use state value
                                rewardTarget={currentRewardTarget.clicks}
                                rewardAmount={currentRewardTarget.amount}
                            />
                        </div>
                    )}

                    <Separator className="my-6 md:my-8 w-full max-w-lg" />

                     {/* Only show click button if logged in and userAccount is loaded */}
                    {user && userAccount ? (
                        <ClickButton
                            remainingQuota={currentQuota} // Pass current quota from state
                            onSuccess={handleSuccessfulClick} // Pass the callback
                        />
                    ) : !user ? (
                        <p className="text-accent-foreground">登入後即可開始點擊！(Log in to start clicking!)</p>
                     ) : (
                         // User is logged in, but account data might still be loading or failed
                         <p className="text-muted-foreground">載入中... (Loading...)</p>
                     )}


                     {/* Bonus Button Example - Conditionally render or disable if not logged in */}
                    <div className="mt-8">
                        <BonusButton
                            type="task"
                            rewardAmount={50}
                            clicksRequired={100}
                            userClicks={userClicksForTask} // Pass dynamic user clicks state
                            onRewardClaimed={handleRewardClaimed}
                            disabled={!user || !userAccount} // Disable if not logged in or account not loaded
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
