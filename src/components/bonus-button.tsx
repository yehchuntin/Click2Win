'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, Gift, Hourglass, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BonusButtonProps {
    type: 'daily' | 'task' | 'chest';
    rewardAmount: number;
    clicksRequired?: number; // Optional: For task-based rewards
    userClicks?: number;     // Optional: Current user clicks for task rewards
    onRewardClaimed: () => void; // Callback to update parent state
    disabled?: boolean; // Optional disabled state from parent
}

export function BonusButton({ type, rewardAmount, clicksRequired, userClicks, onRewardClaimed, disabled: parentDisabled = false }: BonusButtonProps) {
    const [isClaimed, setIsClaimed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0); // Remaining cooldown in seconds
    const [lastClaimTime, setLastClaimTime] = useState<number | null>(null); // Timestamp of last claim
    const { toast } = useToast();
    const cooldownDuration = 3 * 60 * 60; // 3 hours cooldown in seconds

    useEffect(() => {
        // Load last claim time from local storage, specific to button type
        const storedTime = localStorage.getItem(`lastClaimTime_${type}`);
        if (storedTime) {
            const lastClaimTs = parseInt(storedTime, 10);
             setLastClaimTime(lastClaimTs);

             // Also determine if already claimed within cooldown based on stored time
             const timeSinceLastClaim = (Date.now() / 1000) - lastClaimTs;
             const remainingCooldown = Math.max(0, cooldownDuration - timeSinceLastClaim);
             if (remainingCooldown > 0) {
                 setIsClaimed(true); // Consider it "claimed" if still in cooldown from previous session
                 setCooldown(remainingCooldown);
             } else {
                 setIsClaimed(false); // Cooldown expired
             }
        }
    }, [type, cooldownDuration]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | undefined;

        if (cooldown > 0) {
            setIsClaimed(true); // Ensure claimed state is true during cooldown
            intervalId = setInterval(() => {
                setCooldown(prevCooldown => {
                    if (prevCooldown <= 1) {
                        clearInterval(intervalId);
                        setIsClaimed(false); // Cooldown finished, allow claiming again
                        return 0;
                    }
                    return prevCooldown - 1;
                });
            }, 1000);
        } else {
             // If cooldown is 0, ensure claimed state reflects actual completion/claim status
             // This part is tricky without persistent server state, relying on `isCompleted` logic below.
             // For now, if cooldown is 0, we assume it *can* be claimed if conditions met.
             setIsClaimed(false);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [cooldown]);


    const handleClaimReward = async () => {
        // Prevent claim if loading, cooling down, disabled by parent, or task conditions not met
        if (isLoading || cooldown > 0 || parentDisabled || (type === 'task' && (clicksRequired === undefined || userClicks === undefined || userClicks < clicksRequired))) {
             if (parentDisabled) {
                toast({ title: "請先登入 (Please Log In)", description: "您需要登入才能領取獎勵。(You need to be logged in to claim rewards.)", variant: "destructive" });
            } else if (cooldown > 0) {
                 const hours = Math.floor(cooldown / 3600);
                 const minutes = Math.floor((cooldown % 3600) / 60);
                 toast({ title: "冷卻中 (Cooldown Active)", description: `請在 ${hours > 0 ? `${hours}小時` : ''}${minutes > 0 ? `${minutes}分鐘` : ''} 後再試。(Please try again in ${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m` : ''}.)`});
            } else if (type === 'task' && clicksRequired && userClicks !== undefined && userClicks < clicksRequired) {
                 toast({ title: "任務未完成 (Task Incomplete)", description: `還需要 ${clicksRequired - userClicks} 次點擊。(Need ${clicksRequired - userClicks} more clicks.)` });
            }
            return;
        }


        setIsLoading(true);

        // Simulate reward claiming process (replace with actual API call/server action)
        console.log(`Simulating claim for type: ${type}, reward: ${rewardAmount}`);
        // In a real app, this action would:
        // 1. Verify eligibility on the server (auth, cooldown, task completion)
        // 2. Grant the reward (update user balance/inventory)
        // 3. Record the claim time on the server
        // 4. Return the new state (e.g., updated balance, next cooldown time)
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay

        // Assume success for simulation
        const claimTimestamp = Date.now() / 1000; // Store timestamp in seconds
        setIsLoading(false);
        setIsClaimed(true);
        setLastClaimTime(claimTimestamp);

        // Save last claim time to local storage
        localStorage.setItem(`lastClaimTime_${type}`, String(claimTimestamp));
        setCooldown(cooldownDuration); // Start cooldown visually

        toast({
            title: "領獎成功! (Reward Claimed!)",
            description: `恭喜您獲得 $${rewardAmount} (Congratulations! You won $${rewardAmount})`,
        });

        onRewardClaimed(); // Notify parent component (e.g., to refetch data)
    };


    // Determine button disabled state based on all factors
    const isDisabled = parentDisabled || isLoading || cooldown > 0 || (type === 'task' && clicksRequired && (userClicks === undefined || userClicks < clicksRequired));


    const getButtonContent = () => {
        if (parentDisabled) {
             return "請先登入 (Please Log In)";
        }

        if (isLoading) {
            return (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    處理中... (Processing...)
                </>
            );
        }

        if (cooldown > 0) { // Show cooldown timer if active
            const hours = Math.floor(cooldown / 3600);
            const minutes = Math.floor((cooldown % 3600) / 60);
            const seconds = Math.floor(cooldown % 60);

            return (
                <>
                    <Hourglass className="mr-2 h-4 w-4" />
                    {hours > 0 && `${hours} 小時 `}
                    {minutes > 0 && `${minutes} 分鐘 `}
                    {seconds} 秒 (Seconds)
                </>
            );
        }

        // Cooldown is finished or wasn't active
        let buttonText = "領取獎勵 (Claim Reward)";
        let icon = <Gift className="mr-2 h-4 w-4" />;
        let canClaim = true; // Assume can claim unless specific conditions met

        if (type === 'task') {
            if (clicksRequired && userClicks !== undefined) {
                if (userClicks >= clicksRequired) {
                    buttonText = "領取任務獎勵 (Claim Task Reward)";
                    icon = <Sparkles className="mr-2 h-4 w-4" />;
                } else {
                    buttonText = `完成 ${clicksRequired - userClicks} 次點擊 (Complete ${clicksRequired - userClicks} Clicks)`;
                     icon = <Hourglass className="mr-2 h-4 w-4" />; // Or a task icon
                     canClaim = false; // Cannot claim yet
                }
            } else {
                buttonText = "任務未定義 (Task Undefined)";
                canClaim = false; // Cannot claim if undefined
            }
        } else if (type === 'chest') {
            buttonText = "開啟寶箱 (Open Chest)";
            icon = <Gift className="mr-2 h-4 w-4" />; // Replace with a chest icon if available
        } else if (type === 'daily') {
            buttonText = "領取每日獎勵 (Claim Daily Reward)";
            icon = <Gift className="mr-2 h-4 w-4" />;
        }


        return (
            <>
                {icon}
                {buttonText}
            </>
        );
    };

    return (
        <Button
            onClick={handleClaimReward}
            disabled={isDisabled} // Use the combined disabled state
            className={cn(
                "relative rounded-md bg-gradient-to-r from-yellow-400 to-red-500 px-4 py-2 font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95",
                 isDisabled ? "cursor-not-allowed opacity-70" : "hover:from-yellow-500 hover:to-red-600",
                 cooldown > 0 ? "from-gray-500 to-gray-700 hover:from-gray-500 hover:to-gray-700" : "", // Cooldown style
                 (type === 'task' && clicksRequired && userClicks !== undefined && userClicks < clicksRequired && !parentDisabled) ? "from-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-500" : "", // Task incomplete style
            )}
             aria-live="polite" // Announce changes, especially cooldown
        >
            {getButtonContent()}
            {/* Optional: Add a ripple effect on click */}
        </Button>
    );
}
