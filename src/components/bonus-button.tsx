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
}

export function BonusButton({ type, rewardAmount, clicksRequired, userClicks, onRewardClaimed }: BonusButtonProps) {
    const [isClaimed, setIsClaimed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0); // Remaining cooldown in seconds
    const [lastClaimTime, setLastClaimTime] = useState<number | null>(null); // Timestamp of last claim
    const { toast } = useToast();
    const cooldownDuration = 3 * 60 * 60; // 3 hours cooldown in seconds

    useEffect(() => {
        // Load last claim time from local storage
        const storedTime = localStorage.getItem(`lastClaimTime_${type}`);
        if (storedTime) {
            setLastClaimTime(parseInt(storedTime, 10));
        }
    }, [type]);

    useEffect(() => {
        // Calculate initial cooldown on mount
        if (lastClaimTime) {
            const timeSinceLastClaim = (Date.now() / 1000) - lastClaimTime;
            const remainingCooldown = Math.max(0, cooldownDuration - timeSinceLastClaim);
            setCooldown(remainingCooldown);
        }
    }, [lastClaimTime, cooldownDuration]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (cooldown > 0) {
            intervalId = setInterval(() => {
                setCooldown(prevCooldown => {
                    if (prevCooldown <= 1) {
                        clearInterval(intervalId);
                        return 0;
                    }
                    return prevCooldown - 1;
                });
            }, 1000);
        }

        return () => clearInterval(intervalId);
    }, [cooldown]);


    const handleClaimReward = async () => {
        if (isLoading || cooldown > 0) return;

        setIsLoading(true);

        // Simulate reward claiming process (replace with actual API call)
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay

        setIsLoading(false);
        setIsClaimed(true);
        setLastClaimTime(Date.now() / 1000); // Store timestamp in seconds

        // Save last claim time to local storage
        localStorage.setItem(`lastClaimTime_${type}`, String(Date.now() / 1000));
        setCooldown(cooldownDuration); // Start cooldown

        toast({
            title: "領獎成功! (Reward Claimed!)",
            description: `恭喜您獲得 $${rewardAmount} (Congratulations! You won $${rewardAmount})`,
        });

        onRewardClaimed(); // Notify parent component
    };


    const getButtonContent = () => {
        if (isLoading) {
            return (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    處理中... (Processing...)
                </>
            );
        }

        if (isClaimed) {
            return (
                <>
                    <Check className="mr-2 h-4 w-4" />
                    已領取 (Claimed)
                </>
            );
        }

        if (cooldown > 0) {
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


        let buttonText = "領取獎勵 (Claim Reward)";
        let icon = <Gift className="mr-2 h-4 w-4" />;

        if (type === 'task') {
            if (clicksRequired && userClicks !== undefined) {
                if (userClicks >= clicksRequired) {
                    buttonText = "領取任務獎勵 (Claim Task Reward)";
                    icon = <Sparkles className="mr-2 h-4 w-4" />;
                } else {
                    return `完成 ${clicksRequired} 次點擊以領取 (Complete ${clicksRequired} clicks to claim)`;
                }

            } else {
                return "任務未定義 (Task Undefined)";
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


    const isDisabled = isLoading || cooldown > 0 || (type === 'task' && clicksRequired && (userClicks === undefined || userClicks < clicksRequired));

    return (
        <Button
            onClick={handleClaimReward}
            disabled={isDisabled}
            className={cn(
                "relative rounded-md bg-gradient-to-r from-yellow-400 to-red-500 px-4 py-2 font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95",
                isClaimed ? "cursor-not-allowed opacity-70" : "",
            )}
        >
            {getButtonContent()}
            {/* Optional: Add a ripple effect on click */}
        </Button>
    );
}
