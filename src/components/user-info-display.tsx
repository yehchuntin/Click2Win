import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Users, CheckCircle } from "lucide-react"; // Added CheckCircle
import type { UserAccount } from "@/services/account"; // Import the Firestore UserAccount type

interface UserInfoDisplayProps {
  userAccount: UserAccount | null; // Accept the full UserAccount object or null
}

export function UserInfoDisplay({ userAccount }: UserInfoDisplayProps) {
  // Destructure with defaults for when userAccount is null (logged out or loading)
  const {
    todayClicks = 0,
    dailyQuota = 0,
    totalClicks = 0,
    // referralCount = 0, // Not currently in the Firestore UserAccount interface
  } = userAccount || {};

  const clicksRemaining = Math.max(0, dailyQuota - todayClicks);

  return (
    <Card className="bg-card/80 backdrop-blur-sm shadow-md border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-card-foreground">
          用戶資訊 (User Info)
        </CardTitle>
        <User className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
         {userAccount ? (
           <>
             <div className="text-2xl font-bold text-foreground">{clicksRemaining}</div>
             <p className="text-xs text-muted-foreground">
               今日剩餘點擊次數 (Clicks Remaining Today)
             </p>
             <div className="mt-4 flex items-center">
               <CheckCircle className="h-4 w-4 mr-2 text-muted-foreground" /> {/* Icon for total clicks */}
               <span className="text-sm text-foreground">{totalClicks.toLocaleString()}</span>
               <p className="text-xs text-muted-foreground ml-1">
                 總點擊次數 (Total Clicks)
               </p>
             </div>
             {/* If referralCount is added back to UserAccount: */}
             {/* <div className="mt-2 flex items-center">
               <Users className="h-4 w-4 mr-2 text-muted-foreground" />
               <span className="text-sm text-foreground">{referralCount}</span>
               <p className="text-xs text-muted-foreground ml-1">
                 位推薦 (Referrals)
               </p>
             </div> */}
           </>
         ) : (
           <p className="text-sm text-muted-foreground text-center pt-4">請先登入 (Please Log In)</p>
         )}
      </CardContent>
    </Card>
  );
}
