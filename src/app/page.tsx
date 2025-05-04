
'use client';

import { ClickButton } from "@/components/click-button";
import { GlobalInfoDisplay } from "@/components/global-info-display";
import { UserInfoDisplay } from "@/components/user-info-display";
import { Separator } from "@/components/ui/separator";
// Removed direct service imports: import { getUserAccount } from "@/services/account";
// Removed direct service imports: import { getGlobalClickCount } from "@/services/reward";
// Removed direct logic import: import { getCurrentRewardTarget } from "@/lib/reward-logic";
import { BonusButton } from "@/components/bonus-button"; // Keep BonusButton
import { useState, useEffect, useCallback } from 'react';
import { SponsorActivityArea } from '@/components/home/sponsor-activity-area'; // Import Sponsor Activity Area
import { BottomNavBar } from '@/components/layout/bottom-nav-bar'; // Import Bottom Navigation Bar
import type { UserAccount } from '@/services/account'; // Import UserAccount type from updated service
// Removed action result type: import type { ClickActionResult } from '@/app/actions/click-actions';
import { useAuth } from "@/hooks/use-auth"; // Import useAuth hook
import { Loader2 } from "lucide-react"; // Import Loader
import { useToast } from "@/hooks/use-toast"; // Import useToast

// Define the expected API response structure for click results
interface ClickApiResponse {
    success: boolean;
    message?: string;
    error?: string;
    totalClicks?: number; // Global total clicks
    todayClicks?: number; // User's clicks today after this click
    reward?: { type: string; amount: number | string };
}


export default function Home() {
    const { user, loading: authLoading } = useAuth(); // Get user and loading state
    const { toast } = useToast();
    const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
    // Global click count is now fetched within GlobalInfoDisplay
    // const [globalClickCount, setGlobalClickCount] = useState<number | null>(null);
    const [userClicksForTask, setUserClicksForTask] = useState(0); // Example state for bonus task tracking
    const [loadingUserData, setLoadingUserData] = useState(true); // State for user data loading

    // Fetch user account data when user logs in or on mount if already logged in
    const fetchUserAccount = useCallback(async (uid: string) => {
        console.log("Fetching user account via API for:", uid);
        setLoadingUserData(true);
        try {
            // Replace with an API call if you create a dedicated endpoint for user data
            // For now, we'll rely on the ensureUserExists happening implicitly
            // during the first click or other actions, or fetch it directly if needed.
            // Example direct fetch (requires creating this service function):
            // const account = await getUserAccountFromApi(uid); // You'd need to create this
            // setUserAccount(account);

            // Simulate fetching or assume it will be populated by interactions
             // If getUserAccount is client-callable (less ideal for sensitive data)
             // import { getUserAccount } from '@/services/account'; // Needs 'use client' in service potentially
             // const account = await getUserAccount(uid);
             // setUserAccount(account);

             // TEMPORARY: Simulate fetching user data (replace with API call or ensureUserExists call)
             // This is non-ideal as it uses a server-intended function client-side
             // You should ideally fetch this via an API route GET /api/user/{uid} or similar
             console.warn("Simulating user data fetch client-side. Replace with API call.");
             // Dummy data until API is ready
             setUserAccount({
                 uid: uid,
                 todayClicks: 0, // Will update after first click API call
                 dailyQuota: 50, // Default, will sync after first click
                 totalClicks: 0, // Will update after first click
                 rewards: [],
                 // email: user?.email || '', // Get from auth context
                 // displayName: user?.displayName || '' // Get from auth context
             });


        } catch (error) {
            console.error("Error fetching user account data:", error);
            toast({ title: "無法載入用戶資料 (Failed to load user data)", variant: "destructive" });
            setUserAccount(null); // Set to null on error
        } finally {
            setLoadingUserData(false); // Finish loading user data
        }
    }, [toast]); // Added toast dependency

    useEffect(() => {
        if (!authLoading && user) {
            fetchUserAccount(user.uid);
        } else if (!authLoading && !user) {
            // User logged out, clear account data and stop loading
            setUserAccount(null);
            setLoadingUserData(false);
        }
        // If auth is loading, do nothing, wait for it to finish
    }, [user, authLoading, fetchUserAccount]);


    // Removed getCurrentRewardTarget logic, handled by GlobalInfoDisplay

    const handleRewardClaimed = useCallback(async () => {
        console.log("Reward claimed, refetching user state...");
        if (user) {
           await fetchUserAccount(user.uid); // Refetch user data after claim
        }
    }, [user, fetchUserAccount]);


    // Callback for ClickButton to update state after a successful API call
    const handleSuccessfulClick = (result: ClickApiResponse) => {
        if (result.success) {
            // Update user account state based on API response
             if (userAccount && result.todayClicks !== undefined) {
                  // Also update total clicks if provided by API
                 const updatedTotalClicks = result.totalClicks !== undefined
                     ? (userAccount.totalClicks + 1) // Rough client-side update (API totalClicks is global)
                     : userAccount.totalClicks;

                 setUserAccount(prev => prev ? {
                    ...prev,
                    todayClicks: result.todayClicks!,
                    // Daily quota might change, fetchUserAccount might be better after click
                    // dailyQuota: result.newQuota !== undefined ? result.newQuota : prev.dailyQuota,
                    totalClicks: updatedTotalClicks, // Update local total
                 } : null);
            }
            // No need to update globalClickCount state here, GlobalInfoDisplay handles it

             // Increment local task clicks state for demonstration
             setUserClicksForTask(prev => prev + 1);
        }
        // Error handling or specific messages are handled by the toast in ClickButton or the API response itself
    };

    // Determine current quota, handling null userAccount
    const currentQuota = userAccount ? userAccount.dailyQuota - userAccount.todayClicks : 0;
    const remainingQuota = Math.max(0, currentQuota);


    // Show loading spinner if auth or user data is loading
    if (authLoading || loadingUserData) {
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

                    {/* Display global info and user info */}
                    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                        {/* Pass userAccount state to UserInfoDisplay */}
                        <UserInfoDisplay userAccount={userAccount} />

                        <Separator orientation="vertical" className="hidden md:block mx-auto h-auto" />
                        <Separator orientation="horizontal" className="block md:hidden my-4 w-full" />

                        {/* GlobalInfoDisplay fetches its own data */}
                        <GlobalInfoDisplay />
                    </div>


                    <Separator className="my-6 md:my-8 w-full max-w-lg" />

                     {/* Only show click button if logged in */}
                    {user ? (
                        <ClickButton
                            remainingQuota={remainingQuota} // Pass remaining quota
                            onSuccess={handleSuccessfulClick} // Pass the callback
                        />
                    ) : (
                        <p className="text-accent-foreground">登入後即可開始點擊！(Log in to start clicking!)</p>
                     )}


                     {/* Bonus Button Example - Conditionally render or disable if not logged in */}
                    <div className="mt-8">
                        <BonusButton
                            type="task" // Example bonus type
                            rewardAmount={50} // Example reward
                            clicksRequired={100} // Example task requirement
                            userClicks={userClicksForTask} // Pass dynamic user clicks state for this task
                            onRewardClaimed={handleRewardClaimed} // Callback when reward is claimed
                            disabled={!user} // Disable if not logged in
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
