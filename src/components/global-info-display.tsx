"use client"; // Required for useEffect and useState

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Trophy, Loader2 } from "lucide-react";

// Interface for the data fetched from the API
interface GlobalInfoData {
  totalClicks: number;
  nextRewardThreshold: number;
  nextRewardAmount: number | string;
}

// Props for the component (initial data can be passed, but fetching is primary)
interface GlobalInfoDisplayProps {
  // Optional: Pass initial data to avoid initial loading state if fetched server-side
  initialData?: GlobalInfoData;
}

export function GlobalInfoDisplay({ initialData }: GlobalInfoDisplayProps) {
  const [globalInfo, setGlobalInfo] = useState<GlobalInfoData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData); // Start loading if no initial data
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGlobalInfo = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/global'); // Fetch from the new API endpoint

        if (!response.ok) {
           // Try to get the specific error message from the API response body
           let errorMsg = `Failed to fetch global info: ${response.statusText}`;
           try {
               const errorData = await response.json();
               if (errorData.error) {
                   errorMsg = errorData.error; // Use the specific error from the API
               }
           } catch (jsonError) {
               // Ignore if response body is not JSON or parsing fails
               console.error("Could not parse error response JSON:", jsonError);
           }
           throw new Error(errorMsg); // Throw the potentially more specific error
        }

        const data: GlobalInfoData = await response.json();
        setGlobalInfo(data);
      } catch (err: any) {
        console.error("Error fetching global info:", err);
        // Set the error state with the message (could be generic or specific from API)
        setError(err.message || "無法載入全球資訊。(Could not load global info.)");
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch data initially if no initialData is provided
    if (!initialData) {
         fetchGlobalInfo();
    }

    // Optional: Set up polling or use websockets for real-time updates
    // const intervalId = setInterval(fetchGlobalInfo, 15000); // Example: Fetch every 15 seconds
    // return () => clearInterval(intervalId);

  }, [initialData]); // Depend on initialData to prevent re-fetch if provided

  const renderContent = () => {
    if (isLoading) {
        return <div className="flex items-center justify-center h-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
    }
    if (error) {
      // Display the specific error message caught
      return <p className="text-xs text-destructive text-center h-20 flex items-center justify-center px-4">{error}</p>;
    }
    if (globalInfo) {
        const clicksToGo = Math.max(0, globalInfo.nextRewardThreshold - globalInfo.totalClicks);
        return (
        <>
          <div className="text-2xl font-bold text-foreground">
            {globalInfo.totalClicks.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            目前全球點擊次數 (Global Clicks)
          </p>
          <div className="mt-4 flex items-center">
            <Trophy className="h-4 w-4 mr-2 text-yellow-400" />
            <span className="text-sm font-semibold text-foreground">
                下個獎勵 ${globalInfo.nextRewardAmount.toLocaleString()} (Next Reward)
            </span>
            <p className="text-xs text-muted-foreground ml-1">
                (目標 {globalInfo.nextRewardThreshold.toLocaleString()} 次)
            </p>
          </div>
           <p className="text-xs text-muted-foreground mt-1">
               (還差 {clicksToGo.toLocaleString()} 次點擊)
           </p>
        </>
        );
    }
    return <p className="text-xs text-muted-foreground text-center h-20 flex items-center justify-center">無法載入資料。(No data available.)</p>; // Fallback
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm shadow-md border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-card-foreground">
          全球進度 (Global Progress)
        </CardTitle>
        <Globe className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
