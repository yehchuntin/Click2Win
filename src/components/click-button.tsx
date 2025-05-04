
"use client";

import { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { handleClickAction, ClickActionResult } from '@/app/actions/click-actions'; // Import result type
import { Loader2, Zap } from 'lucide-react'; // Zap for click icon
import { useAuth } from '@/hooks/use-auth'; // Import useAuth hook

interface ClickButtonProps {
  remainingQuota: number; // Receive quota as a prop
  onSuccess: (result: ClickActionResult) => void; // Callback on successful click
}

export function ClickButton({ remainingQuota, onSuccess }: ClickButtonProps) {
  // No local quota state needed, use the prop directly
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useAuth(); // Get user from auth hook

  // No useEffect needed for initialQuota

  const handleButtonClick = async () => {
    if (!user) {
      toast({ title: "請先登入 (Please Log In)", description: "您需要登入才能點擊。(You need to be logged in to click.)", variant: "destructive" });
      return;
    }

    if (remainingQuota <= 0 || isLoading || isPending) {
        // Don't show toast here if we only want winner toasts or quota messages
        // (Quota message is shown below the button)
        return;
    }

    setIsLoading(true); // Indicate loading state visually

    startTransition(async () => {
      try {
        // Pass the user ID to the server action
        const result = await handleClickAction(user.uid);

        onSuccess(result); // Call the parent callback with the result

        // Only show a toast if a reward was won
        if (result.success && result.rewardWon && result.rewardWon > 0) {
            const toastTitle = "恭喜！(Congratulations!)";
            // Use the specific win message from the server action, or a fallback
            const toastDescription = result.message || `您贏得了 $${result.rewardWon}! (You won $${result.rewardWon}!)`;
            toast({
            title: toastTitle,
            description: toastDescription,
            });
        } else if (!result.success && result.error) {
           // Show error toast only if an error message exists (e.g., quota exceeded)
           // Avoid showing generic failure toasts unless necessary.
           // The quota message below the button handles the quota case.
           if (result.error !== "用戶每日點擊次數已用完 (User daily click quota exhausted).") {
               toast({
                 title: "點擊失敗 (Click Failed)",
                 description: result.error,
                 variant: "destructive",
               });
           }
        }
      } catch (error) {
        console.error("Click action error:", error);
         // Show toast for unexpected errors (optional)
         toast({
           title: "點擊時發生錯誤 (Error During Click)",
           description: "請稍後再試。(Please try again later.)",
           variant: "destructive",
         });
      } finally {
        setIsLoading(false); // Reset loading state
      }
    });
  };

   // Disable button if not logged in, quota is zero, or processing
  const isDisabled = !user || remainingQuota <= 0 || isLoading || isPending;

  return (
    <div className="flex flex-col items-center gap-4">
       <Button
        onClick={handleButtonClick}
        disabled={isDisabled}
        size="lg"
        className="px-12 py-8 text-2xl rounded-full shadow-lg transform transition-transform duration-150 ease-in-out hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground"
        aria-live="polite" // Announce changes for screen readers
        aria-disabled={isDisabled} // Inform assistive tech about disabled state
      >
        {isLoading || isPending ? (
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        ) : (
          <Zap className="mr-2 h-6 w-6" />
        )}
        {isLoading || isPending ? '處理中... (Processing...)' : '點擊我! (Click Me!)'}
      </Button>
      <p className="text-sm text-muted-foreground">
        剩餘點擊次數 (Clicks Remaining): {user ? remainingQuota : '-'} {/* Show '-' if not logged in */}
      </p>
       {user && remainingQuota <= 0 && (
         <p className="text-sm text-accent-foreground font-semibold">今天次數已用完，明天再來！(Clicks used up for today, come back tomorrow!)</p>
       )}
       {!user && (
            <p className="text-sm text-accent-foreground">登入後即可查看剩餘次數。(Log in to see remaining clicks.)</p>
       )}
    </div>
  );
}
