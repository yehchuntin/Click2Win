"use client";

import { useState, useEffect, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { handleClickAction } from '@/app/actions/click-actions';
import { Loader2, Zap } from 'lucide-react'; // Zap for click icon

interface ClickButtonProps {
  initialQuota: number;
}

export function ClickButton({ initialQuota }: ClickButtonProps) {
  const [remainingQuota, setRemainingQuota] = useState(initialQuota);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Ensure initial quota is set on mount to avoid hydration mismatch
  useEffect(() => {
    setRemainingQuota(initialQuota);
  }, [initialQuota]);

  const handleButtonClick = async () => {
    if (remainingQuota <= 0 || isLoading || isPending) {
      toast({
        title: "無法點擊",
        description: remainingQuota <= 0 ? "您今天的點擊次數已用完。" : "請稍候再試。",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true); // Indicate loading state visually

    startTransition(async () => {
      try {
        const result = await handleClickAction();

        if (result.success) {
          setRemainingQuota((prev) => prev - 1); // Decrease quota locally immediately for responsiveness
          toast({
            title: "點擊成功！",
            description: result.message,
          });
          // Optionally trigger a UI update for global count or reward info here if needed
        } else {
          toast({
            title: "點擊失敗",
            description: result.error || "發生未知錯誤。",
            variant: "destructive",
          });
          // If the server says the quota was actually 0, sync the state
          if (result.error?.includes("quota")) {
             setRemainingQuota(0);
          }
        }
      } catch (error) {
        console.error("Click action error:", error);
        toast({
          title: "點擊時發生錯誤",
          description: "請稍後再試。",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false); // Reset loading state
      }
    });
  };

  const isDisabled = remainingQuota <= 0 || isLoading || isPending;

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
        {isLoading || isPending ? '處理中...' : '點擊我!'}
      </Button>
      <p className="text-sm text-muted-foreground">
        剩餘點擊次數: {remainingQuota}
      </p>
       {remainingQuota <= 0 && (
         <p className="text-sm text-accent-foreground font-semibold">今天次數已用完，明天再來！</p>
       )}
    </div>
  );
}
