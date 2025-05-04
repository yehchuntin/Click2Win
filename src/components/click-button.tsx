
"use client";

import { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
// Removed direct action import: import { handleClickAction, ClickActionResult } from '@/app/actions/click-actions';
import { Loader2, Zap } from 'lucide-react'; // Zap for click icon
import { useAuth } from '@/hooks/use-auth'; // Import useAuth hook

// Define the expected API response structure based on the new API
interface ClickApiResponse {
    success: boolean;
    message?: string;
    error?: string;
    totalClicks?: number; // Global total clicks
    todayClicks?: number; // User's clicks today after this click
    reward?: { type: string; amount: number | string }; // Reward details if won
}


interface ClickButtonProps {
  remainingQuota: number; // Receive quota as a prop
  // Callback prop to update parent state after successful API call
  onSuccess: (apiResult: ClickApiResponse) => void;
}

export function ClickButton({ remainingQuota, onSuccess }: ClickButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useAuth(); // Get user from auth hook

  const handleButtonClick = async () => {
    if (!user) {
      toast({ title: "請先登入 (Please Log In)", description: "您需要登入才能點擊。(You need to be logged in to click.)", variant: "destructive" });
      return;
    }

    if (remainingQuota <= 0 || isLoading || isPending) {
        // Optional: Show toast if clicking disabled due to quota
        // if (remainingQuota <= 0) {
        //    toast({ title: "次數用盡 (Quota Exhausted)", description: "今天次數已用完。(Clicks used up for today.)" });
        // }
        return;
    }

    setIsLoading(true); // Indicate loading state visually

    startTransition(async () => {
      try {
        // Call the backend API endpoint instead of the server action
        const response = await fetch('/api/click', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uid: user.uid }), // Send user ID in the request body
        });

        const result: ClickApiResponse = await response.json();

        if (response.ok && result.success) {
            // Call the parent callback with the successful result
            onSuccess(result);

             // Show toast only if a reward was won (based on API response)
            if (result.reward) {
                const toastTitle = "恭喜！(Congratulations!)";
                const toastDescription = result.message || `您贏得了獎勵! (You won a reward!)`; // Use API message or generic
                toast({
                    title: toastTitle,
                    description: toastDescription,
                });
            } else {
                 // Optionally show a subtle success message for regular clicks
                 // toast({ description: result.message || "Click recorded!" });
            }
        } else {
             // Handle API error or unsuccessful response
             console.error("API Click Error:", result.error || `Status: ${response.status}`);
             const errorDescription = result.error || '點擊失敗，請稍後再試。(Click failed, please try again later.)';
            toast({
                title: "點擊失敗 (Click Failed)",
                description: errorDescription,
                variant: "destructive",
            });
            // Optionally call onSuccess even on failure if parent needs to know
            // onSuccess(result);
        }
      } catch (error) {
        console.error("API request error:", error);
         // Show toast for network or unexpected errors
         toast({
           title: "點擊時發生錯誤 (Error During Click)",
           description: "無法連接伺服器，請檢查網路連線。(Could not connect to server, please check network.)",
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
