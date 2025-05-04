import { ClickButton } from "@/components/click-button";
import { GlobalInfoDisplay } from "@/components/global-info-display";
import { UserInfoDisplay } from "@/components/user-info-display";
import { Separator } from "@/components/ui/separator";
import { getUserAccount } from "@/services/account";
import { getGlobalClickCount } from "@/services/reward";
import { getCurrentRewardTarget } from "@/lib/reward-logic";

export default async function Home() {
  // Fetch initial data on the server
  const [userAccount, globalClickCount] = await Promise.all([
    getUserAccount('test-user'), // Replace 'test-user' with actual logged-in user ID
    getGlobalClickCount(),
  ]);

  const currentRewardTarget = getCurrentRewardTarget(globalClickCount);


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 lg:p-24 bg-gradient-to-br from-background via-secondary to-background">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-center text-primary-foreground mb-6">
          Click<span className="text-primary">2</span>Win
        </h1>

        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <UserInfoDisplay
            dailyClickQuota={userAccount.dailyClickQuota}
            referralCount={userAccount.referralCount}
          />
          <Separator orientation="vertical" className="hidden md:block mx-auto h-auto" />
          <Separator orientation="horizontal" className="block md:hidden my-4 w-full" />
           <GlobalInfoDisplay
            globalClickCount={globalClickCount}
            rewardTarget={currentRewardTarget.clicks}
            rewardAmount={currentRewardTarget.amount}
          />
        </div>

        <Separator className="my-6 md:my-8 w-full max-w-lg" />

        <ClickButton initialQuota={userAccount.dailyClickQuota} />

        <p className="text-xs text-muted-foreground mt-8 text-center max-w-md">
          點擊按鈕！當全球點擊次數達到目標時，幸運的點擊者將贏得獎勵。每人每天有固定的點擊次數，分享給朋友可以獲得額外次數！
        </p>
         <p className="text-xs text-muted-foreground mt-2 text-center max-w-md">
          Click the button! When the global click count reaches the target, the lucky clicker wins the reward. Everyone has a daily click limit, and referring friends grants extra clicks!
        </p>
      </div>
    </main>
  );
}
