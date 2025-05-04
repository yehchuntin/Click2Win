import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Users } from "lucide-react";

interface UserInfoDisplayProps {
  dailyClickQuota: number;
  referralCount: number;
}

export function UserInfoDisplay({ dailyClickQuota, referralCount }: UserInfoDisplayProps) {
  return (
    <Card className="bg-card/80 backdrop-blur-sm shadow-md border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-card-foreground">
          用戶資訊
        </CardTitle>
        <User className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{dailyClickQuota}</div>
        <p className="text-xs text-muted-foreground">
          今日剩餘點擊次數
        </p>
        <div className="mt-4 flex items-center">
          <Users className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-sm text-foreground">{referralCount}</span>
          <p className="text-xs text-muted-foreground ml-1">
            位推薦
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
