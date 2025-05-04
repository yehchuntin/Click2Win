'use client';

import { useParams, useRouter } from 'next/navigation'; // Added useRouter
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Gift, Info, Link as LinkIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth
import { Separator } from '@/components/ui/separator'; // Import Separator

// Interfaces matching API structures
interface ActivityDefinition {
    id: string;
    name: string;
    description: string;
    clicksRequired: number;
    reward: { type: string; amount: number | string; };
    sponsorName?: string; // Optional fields from previous mock
    sponsorLogoUrl?: string;
    sponsorWebsite?: string;
    imageUrl?: string;
}

interface UserActivityProgress {
    uid: string;
    activityId: string;
    clicks: number;
    clicksRequired: number;
    completed: boolean;
    rewardClaimed: boolean;
    activityName?: string;
    reward?: { type: string; amount: number | string; } | null;
}

// --- API Interaction Functions ---

// Fetch activity definition and user progress together
async function fetchActivityStatus(activityId: string, uid: string): Promise<UserActivityProgress | null> {
    console.log(`Fetching activity status for activity: ${activityId}, user: ${uid}`);
    try {
        const response = await fetch(`/api/activity/${activityId}/status?uid=${uid}`);
        if (!response.ok) {
            if (response.status === 404) {
                 console.warn(`Activity definition or progress not found for ${activityId}`);
                 return null; // Treat as not found
            }
            throw new Error(`Failed to fetch activity status: ${response.statusText}`);
        }
        const data: UserActivityProgress = await response.json();
        console.log("Received activity status:", data);
        return data;
    } catch (error) {
        console.error("Error fetching activity status:", error);
        throw error; // Re-throw to be caught by caller
    }
}


// Call API to record an activity click
async function handleActivityClickApi(activityId: string, uid: string): Promise<{ success: boolean; clicks?: number; completed?: boolean; error?: string; reward?: any | null }> {
    console.log(`Handling activity click via API for activity: ${activityId}, user: ${uid}`);
    try {
        const response = await fetch('/api/activity-click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, activityId }),
        });

        const result = await response.json();

        if (!response.ok) {
             return { success: false, error: result.error || `API Error: ${response.status}` };
        }

         console.log("Activity click API response:", result);
         return {
            success: result.success,
            clicks: result.clicks,
            completed: result.completed,
            reward: result.reward, // Pass reward info if just completed
            error: result.error,
         };

    } catch (error) {
        console.error("Error calling activity click API:", error);
        return { success: false, error: 'Network error or failed to reach server.' };
    }
}


export default function ActivityPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string; // Activity ID is the slug
  const { user, loading: authLoading } = useAuth(); // Use auth hook
  const [activityStatus, setActivityStatus] = useState<UserActivityProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [clicking, setClicking] = useState(false);
  const { toast } = useToast();

  // Get user ID (from auth context or potentially localStorage fallback)
  const uid = user?.uid;

  const loadData = useCallback(async () => {
       if (!uid || !slug) {
           // If no user or no slug, stop loading and potentially redirect or show message
           if (!authLoading && !uid) {
               toast({ title: '未登入 (Not Logged In)', description: '請先登入以查看活動詳情。(Please log in to view activity details.)', variant: 'destructive' });
               router.push('/signin?next=/activity/' + slug); // Redirect to signin
           }
           setLoading(false);
           return;
       }

       setLoading(true);
       try {
           const data = await fetchActivityStatus(slug, uid);
           if (data) {
               setActivityStatus(data);
           } else {
               toast({ title: '錯誤 (Error)', description: '找不到此活動或您的進度。(Activity or your progress not found.)', variant: 'destructive' });
               // Optionally redirect to home or a 404 page
               // router.push('/');
           }
       } catch (error) {
           console.error("Error loading activity status:", error);
           toast({ title: '錯誤 (Error)', description: '無法載入活動詳情。(Failed to load activity details.)', variant: 'destructive' });
       } finally {
           setLoading(false);
       }
   }, [uid, slug, toast, authLoading, router]); // Include dependencies

  useEffect(() => {
    // Load data when component mounts or when user/slug changes, after auth check
    if (!authLoading) {
         loadData();
    }
  }, [authLoading, loadData]); // Run effect when auth loading finishes or loadData changes


  const handleClick = async () => {
    if (!activityStatus || clicking || activityStatus.completed || !uid) return;

    setClicking(true);
    try {
      const result = await handleActivityClickApi(slug, uid);
      if (result.success) {
         // Update local state optimistically or refetch
         setActivityStatus(prev => prev ? {
             ...prev,
             clicks: result.clicks ?? prev.clicks, // Use new clicks from API
             completed: result.completed ?? prev.completed, // Use new completed status
             // Reward claimed status might need another fetch or be part of API response
         } : null);


        if (result.completed && !activityStatus.completed) { // Check if it *just* became completed based on API result
           toast({
            title: '任務完成！(Task Complete!)',
            description: `您已完成 ${activityStatus.activityName || slug}！獎勵：${activityStatus.reward?.amount || '獎勵'} (You have completed ${activityStatus.activityName || slug}! Reward: ${activityStatus.reward?.amount || 'Reward'})`,
           });
           // Optionally refetch status to confirm reward claimed status etc.
           // await loadData();
        }
        // Optional: Show progress toast
        // toast({ title: '點擊成功 (Click Successful)', description: `進度 (Progress): ${result.clicks}/${activityStatus.clicksRequired}` });

      } else {
        toast({ title: '點擊失敗 (Click Failed)', description: result.error || '發生錯誤 (An error occurred)', variant: 'destructive' });
      }
    } catch (error) {
      console.error("Error handling activity click API call:", error);
      toast({ title: '點擊錯誤 (Click Error)', description: '請稍後再試 (Please try again later)', variant: 'destructive' });
    } finally {
      setClicking(false);
    }
  };

  // --- Loading and Not Found States ---
  if (loading || authLoading) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-var(--header-height))] items-center justify-center p-4">
         <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!uid && !authLoading) {
      // Already handled by useEffect redirecting, but keep a fallback message
       return (
         <div className="container mx-auto flex min-h-[calc(100vh-var(--header-height))] flex-col items-center justify-center p-4 text-center">
           <h1 className="text-2xl font-semibold text-destructive mb-4">需要登入 (Login Required)</h1>
           <p className="text-muted-foreground mb-6">請先登入以繼續。(Please log in to continue.)</p>
           <Button asChild variant="outline">
             <Link href={`/signin?next=/activity/${slug}`}>
               前往登入 (Go to Login)
             </Link>
           </Button>
         </div>
       );
   }


  if (!activityStatus && !loading) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-var(--header-height))] flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-semibold text-destructive mb-4">活動不存在 (Activity Not Found)</h1>
        <p className="text-muted-foreground mb-6">您尋找的活動頁面不存在或無法載入。(The activity page does not exist or could not be loaded.)</p>
         <Button asChild variant="outline">
           <Link href="/">
             <ArrowLeft className="mr-2 h-4 w-4" /> 返回首頁 (Back to Home)
           </Link>
         </Button>
      </div>
    );
  }
  // --- Render Activity Details ---
  // Use data from activityStatus
  const progressPercentage = Math.min(100, (activityStatus.clicks / activityStatus.clicksRequired) * 100);
  const isCompleted = activityStatus.completed;
  const activityName = activityStatus.activityName || slug;
  const rewardDescription = activityStatus.reward ? `${activityStatus.reward.amount} ${activityStatus.reward.type}` : '獎勵 (Reward)';

  // Placeholder details - ideally fetch these with activity definition
  const imageUrl = `https://picsum.photos/seed/${slug}/600/400`;
  const sponsorName = "合作夥伴 (Partner)"; // Replace with actual data if available
  const sponsorLogoUrl = `https://picsum.photos/seed/${slug}logo/40/40`;
  const sponsorWebsite = "#"; // Replace with actual data


  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-8">
       <Button asChild variant="outline" size="sm" className="mb-6">
           <Link href="/">
             <ArrowLeft className="mr-2 h-4 w-4" /> 返回首頁 (Back to Home)
           </Link>
       </Button>

      <Card className="overflow-hidden shadow-lg border-border/60">
         <CardHeader className="relative p-0">
             <Image
                 // Use placeholder image logic or fetch from definition
                 src={imageUrl}
                 alt={activityName}
                 width={800}
                 height={400}
                 className="w-full h-48 md:h-64 object-cover"
                 data-ai-hint="activity banner promotion"
             />
         </CardHeader>
         <CardContent className="p-6">
           <CardTitle className="text-2xl md:text-3xl font-bold mb-2">{activityName}</CardTitle>
           {/* Add description from activityDefinition if available */}
           <CardDescription className="text-muted-foreground mb-4">完成 {activityStatus.clicksRequired.toLocaleString()} 次點擊即可獲得 {rewardDescription}！ (Complete {activityStatus.clicksRequired.toLocaleString()} clicks to get {rewardDescription}!)</CardDescription>

            {/* Sponsor Info - Replace with actual data */}
           <div className="flex items-center space-x-2 mb-4 text-sm text-muted-foreground">
             <Image src={sponsorLogoUrl} alt={`${sponsorName} logo`} width={24} height={24} className="rounded-full" data-ai-hint="company logo"/>
             <span>由 <a href={sponsorWebsite} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{sponsorName}</a> 贊助</span>
             <a href={sponsorWebsite} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${sponsorName} website`}>
                <LinkIcon className="h-4 w-4 text-primary hover:text-primary/80"/>
             </a>
           </div>

           <Separator className="my-4" />

           <div className="mb-4">
             <h3 className="text-lg font-semibold mb-2">活動獎勵 (Activity Reward)</h3>
             <div className="flex items-center space-x-2 p-3 bg-accent/50 rounded-md border border-accent">
                 <Gift className="h-5 w-5 text-primary" />
                 <span className="text-accent-foreground font-medium">{rewardDescription}</span>
             </div>
           </div>

           <div className="mb-6">
             <h3 className="text-lg font-semibold mb-2">您的進度 (Your Progress)</h3>
             <Progress value={progressPercentage} className="w-full h-3 mb-1" />
             <p className="text-sm text-muted-foreground text-right">
                {activityStatus.clicks.toLocaleString()} / {activityStatus.clicksRequired.toLocaleString()} 次點擊 (Clicks)
             </p>
           </div>

           <Button
             onClick={handleClick}
             disabled={clicking || isCompleted || !uid} // Disable if clicking, completed, or not logged in
             size="lg"
             className="w-full text-lg font-semibold"
           >
             {clicking ? (
               <Loader2 className="mr-2 h-5 w-5 animate-spin" />
             ) : isCompleted ? (
                 '已完成！(Completed!)'
             ) : (
               '點擊參與！(Click to Participate!)'
             )}
           </Button>

         </CardContent>
         <CardFooter className="bg-muted/50 p-4 text-xs text-muted-foreground">
             <Info className="h-4 w-4 mr-2" />
             {isCompleted ? '您已完成此活動。(You have completed this activity.)' : '每個點擊都會計入您的進度。完成後即可領取獎勵。(Each click counts towards your progress. Claim your reward upon completion.)'}
         </CardFooter>
      </Card>
    </div>
  );
}

// Remove mock data and functions (fetchActivityDetails, handleActivityClick)
// const MOCK_ACTIVITIES...
// async function fetchActivityDetails...
// async function handleActivityClick...
