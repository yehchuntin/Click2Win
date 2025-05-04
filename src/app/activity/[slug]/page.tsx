'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Gift, Info, Link as LinkIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Mock data structure for sponsor activities - replace with actual data fetching
interface SponsorActivity {
  slug: string;
  name: string;
  description: string;
  sponsorName: string;
  sponsorLogoUrl: string; // Placeholder for sponsor logo
  sponsorWebsite: string;
  imageUrl: string; // Main activity image
  rewardType: 'coupon' | 'discount' | 'entry' | 'physical';
  rewardDescription: string;
  clicksRequired: number;
  userProgress?: number; // User's current clicks for this activity (fetch per user)
  isCompleted?: boolean; // Has the user completed this activity?
}

// Mock function to fetch activity details - replace with API call
async function fetchActivityDetails(slug: string): Promise<SponsorActivity | null> {
    console.log(`Fetching activity details for slug: ${slug}`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real app, fetch from your backend/database based on the slug
    const MOCK_ACTIVITIES: SponsorActivity[] = [
        {
            slug: 'sponsor-a-event',
            name: '點擊挑戰賽 A (Click Challenge A)',
            description: '完成 50 次點擊即可獲得合作夥伴 A 提供的獨家 $10 折價券！適用於所有線上商品。 (Complete 50 clicks to get an exclusive $10 coupon from Partner A! Valid on all online products.)',
            sponsorName: '合作夥伴 A (Partner A)',
            sponsorLogoUrl: 'https://picsum.photos/seed/sponsorA/40/40', // Placeholder
            sponsorWebsite: 'https://example.com/sponsor-a',
            imageUrl: 'https://picsum.photos/seed/activityA/600/400', // Placeholder
            rewardType: 'coupon',
            rewardDescription: '$10 折價券 ($10 Coupon)',
            clicksRequired: 50,
            userProgress: 23, // Example user progress
            isCompleted: false,
        },
         {
            slug: 'sponsor-b-draw',
            name: '幸運抽獎 B (Lucky Draw B)',
            description: '累積 100 次點擊，參加合作夥伴 B 提供的最新產品抽獎！點擊越多，機會越大！(Accumulate 100 clicks to enter the lucky draw for Partner B\'s latest product! More clicks, more chances!)',
            sponsorName: '合作夥伴 B (Partner B)',
            sponsorLogoUrl: 'https://picsum.photos/seed/sponsorB/40/40', // Placeholder
            sponsorWebsite: 'https://example.com/sponsor-b',
            imageUrl: 'https://picsum.photos/seed/activityB/600/400', // Placeholder
            rewardType: 'entry',
            rewardDescription: '抽獎機會 (Draw Entry)',
            clicksRequired: 100,
            userProgress: 78, // Example user progress
            isCompleted: false,
        },
         // Add more mock activities
    ];

    const activity = MOCK_ACTIVITIES.find(act => act.slug === slug);
    console.log("Found activity:", activity);
    return activity || null;
}

// Mock function to simulate clicking the activity button - replace with server action
async function handleActivityClick(slug: string, currentProgress: number): Promise<{ success: boolean; newProgress: number; error?: string; rewardWon?: boolean }> {
    console.log(`Handling click for activity: ${slug}, current progress: ${currentProgress}`);
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay

    // In a real app:
    // 1. Verify user authentication
    // 2. Check if user has clicks available (if linked to global quota, or activity-specific quota)
    // 3. Increment progress in the database for this user and activity
    // 4. Check if the required clicks are met
    // 5. If met, mark as completed, potentially grant reward (or flag for claiming)

    const activity = await fetchActivityDetails(slug); // Refetch details to get clicksRequired
    if (!activity) return { success: false, newProgress: currentProgress, error: 'Activity not found.' };

    const newProgress = currentProgress + 1;
    const rewardWon = newProgress >= activity.clicksRequired;

    // TODO: Update actual user progress in the backend here

    console.log(`Click success. New progress: ${newProgress}. Reward won: ${rewardWon}`);
    return { success: true, newProgress: newProgress, rewardWon: rewardWon };
}


export default function ActivityPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [activity, setActivity] = useState<SponsorActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [clicking, setClicking] = useState(false);
  const [userProgress, setUserProgress] = useState(0);
   const [isCompleted, setIsCompleted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (slug) {
      setLoading(true);
      fetchActivityDetails(slug)
        .then(data => {
          if (data) {
            setActivity(data);
            // Initialize user progress and completion status from fetched data
             setUserProgress(data.userProgress || 0);
             setIsCompleted(data.isCompleted || (data.userProgress || 0) >= data.clicksRequired);
          } else {
              // Handle activity not found (e.g., show a 404-like message or redirect)
              toast({ title: '錯誤 (Error)', description: '找不到此活動。(Activity not found.)', variant: 'destructive' });
          }
        })
        .catch(error => {
          console.error("Error fetching activity details:", error);
          toast({ title: '錯誤 (Error)', description: '無法載入活動詳情。(Failed to load activity details.)', variant: 'destructive' });
        })
        .finally(() => setLoading(false));
    }
  }, [slug, toast]);

  const handleClick = async () => {
    if (!activity || clicking || isCompleted) return;

    setClicking(true);
    try {
      const result = await handleActivityClick(slug, userProgress);
      if (result.success) {
        setUserProgress(result.newProgress);
         const completed = result.newProgress >= activity.clicksRequired;
         setIsCompleted(completed);

        if (completed && !isCompleted) { // Check if it just became completed
           toast({
            title: '任務完成！(Task Complete!)',
            description: `您已完成 ${activity.name}！獎勵：${activity.rewardDescription} (You have completed ${activity.name}! Reward: ${activity.rewardDescription})`,
           });
           // TODO: Add logic to actually grant/claim the reward here or enable a claim button
        }
        // Optional: Show progress toast
        // toast({ title: '點擊成功 (Click Successful)', description: `進度 (Progress): ${result.newProgress}/${activity.clicksRequired}` });

      } else {
        toast({ title: '點擊失敗 (Click Failed)', description: result.error || '發生錯誤 (An error occurred)', variant: 'destructive' });
      }
    } catch (error) {
      console.error("Error handling activity click:", error);
      toast({ title: '點擊錯誤 (Click Error)', description: '請稍後再試 (Please try again later)', variant: 'destructive' });
    } finally {
      setClicking(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-var(--header-height))] items-center justify-center p-4">
         <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-var(--header-height))] flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-semibold text-destructive mb-4">活動不存在 (Activity Not Found)</h1>
        <p className="text-muted-foreground mb-6">您尋找的活動頁面不存在或已被移除。(The activity page you are looking for does not exist or has been removed.)</p>
         <Button asChild variant="outline">
           <Link href="/">
             <ArrowLeft className="mr-2 h-4 w-4" /> 返回首頁 (Back to Home)
           </Link>
         </Button>
      </div>
    );
  }

  const progressPercentage = Math.min(100, (userProgress / activity.clicksRequired) * 100);

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
                 src={activity.imageUrl}
                 alt={activity.name}
                 width={800}
                 height={400}
                 className="w-full h-48 md:h-64 object-cover"
                 data-ai-hint="activity banner promotion"
             />
            {/* Overlay or Title on image can go here */}
         </CardHeader>
         <CardContent className="p-6">
           <CardTitle className="text-2xl md:text-3xl font-bold mb-2">{activity.name}</CardTitle>
           <CardDescription className="text-muted-foreground mb-4">{activity.description}</CardDescription>

           <div className="flex items-center space-x-2 mb-4 text-sm text-muted-foreground">
             <Image src={activity.sponsorLogoUrl} alt={`${activity.sponsorName} logo`} width={24} height={24} className="rounded-full" data-ai-hint="company logo"/>
             <span>由 <a href={activity.sponsorWebsite} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{activity.sponsorName}</a> 贊助</span>
             <a href={activity.sponsorWebsite} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${activity.sponsorName} website`}>
                <LinkIcon className="h-4 w-4 text-primary hover:text-primary/80"/>
             </a>
           </div>

           <Separator className="my-4" />

           <div className="mb-4">
             <h3 className="text-lg font-semibold mb-2">活動獎勵 (Activity Reward)</h3>
             <div className="flex items-center space-x-2 p-3 bg-accent/50 rounded-md border border-accent">
                 <Gift className="h-5 w-5 text-primary" />
                 <span className="text-accent-foreground font-medium">{activity.rewardDescription}</span>
             </div>
           </div>

           <div className="mb-6">
             <h3 className="text-lg font-semibold mb-2">您的進度 (Your Progress)</h3>
             <Progress value={progressPercentage} className="w-full h-3 mb-1" />
             <p className="text-sm text-muted-foreground text-right">
                {userProgress.toLocaleString()} / {activity.clicksRequired.toLocaleString()} 次點擊 (Clicks)
             </p>
           </div>

           <Button
             onClick={handleClick}
             disabled={clicking || isCompleted}
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
             每個點擊都會計入您的進度。完成後即可領取獎勵。(Each click counts towards your progress. Claim your reward upon completion.)
         </CardFooter>
      </Card>
    </div>
  );
}
