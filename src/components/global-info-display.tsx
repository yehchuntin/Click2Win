"use client"; // Required for useEffect

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Trophy } from "lucide-react";

interface GlobalInfoDisplayProps {
  globalClickCount: number;
  rewardTarget: number;
  rewardAmount: number;
}

export function GlobalInfoDisplay({ globalClickCount: initialGlobalCount, rewardTarget, rewardAmount }: GlobalInfoDisplayProps) {
  // Use state to manage global count to avoid hydration mismatch if it were dynamic
  const [globalClickCount, setGlobalClickCount] = useState(initialGlobalCount);

  useEffect(() => {
    // If this needs to be updated dynamically (e.g., via websockets or polling),
    // update logic would go here. For now, just ensures client matches server prop.
    setGlobalClickCount(initialGlobalCount);
  }, [initialGlobalCount]);


  const clicksToGo = Math.max(0, rewardTarget - globalClickCount);

  return (
    <Card className="bg-card/80 backdrop-blur-sm shadow-md border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-card-foreground">
          全球進度
        </CardTitle>
        <Globe className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
           {globalClickCount.toLocaleString()} / {rewardTarget.toLocaleString()}
        </div>
        <p className="text-xs text-muted-foreground">
          目前全球點擊次數 / 目標
        </p>
        <div className="mt-4 flex items-center">
          <Trophy className="h-4 w-4 mr-2 text-yellow-400" /> {/* Use yellow for trophy */}
          <span className="text-sm font-semibold text-foreground">${rewardAmount.toLocaleString()}</span>
          <p className="text-xs text-muted-foreground ml-1">
             (還差 {clicksToGo.toLocaleString()} 次點擊)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
