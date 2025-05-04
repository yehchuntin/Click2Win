'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Mock data for sponsor activities - replace with data fetched from backend/API
const sponsorActivities = [
  {
    id: '1',
    title: '活動 1 (Activity 1)',
    description: '點擊滿 50 次領取折價券 (Click 50 times for a coupon)',
    imageUrl: 'https://picsum.photos/seed/sponsor1/300/200',
    sponsorLogoUrl: 'https://picsum.photos/seed/logo1/40/40',
    link: '/activity/sponsor-a-event', // Link to the specific activity page
    aiHint: 'coupon discount sale',
  },
  {
    id: '2',
    title: '活動 2 (Activity 2)',
    description: '參加抽獎活動 (Enter the lucky draw)',
    imageUrl: 'https://picsum.photos/seed/sponsor2/300/200',
    sponsorLogoUrl: 'https://picsum.photos/seed/logo2/40/40',
    link: '/activity/sponsor-b-draw',
    aiHint: 'prize draw contest',
  },
  {
    id: '3',
    title: '活動 3 (Activity 3)',
    description: '完成任務換好禮 (Complete task for gift)',
    imageUrl: 'https://picsum.photos/seed/sponsor3/300/200',
    sponsorLogoUrl: 'https://picsum.photos/seed/logo3/40/40',
    link: '/activity/sponsor-c-task', // Example link
    aiHint: 'gift reward challenge',
  },
   {
    id: '4',
    title: '活動 4 (Activity 4)',
    description: '新品體驗活動 (New product trial)',
    imageUrl: 'https://picsum.photos/seed/sponsor4/300/200',
    sponsorLogoUrl: 'https://picsum.photos/seed/logo4/40/40',
    link: '/activity/sponsor-d-trial', // Example link
    aiHint: 'product trial tech',
  },
   // Add more activities
];

export function SponsorActivityArea() {
  return (
    <div className="w-full max-w-6xl mx-auto mb-8">
      <h2 className="text-2xl font-semibold mb-4 px-4 text-foreground">贊助商活動區 (Sponsored Activities)</h2>
      <ScrollArea className="w-full whitespace-nowrap rounded-md">
        <div className="flex w-max space-x-4 p-4">
          {sponsorActivities.map((activity) => (
            <Card key={activity.id} className="w-[280px] overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 border-border/50">
               <Link href={activity.link} className="block group">
                    <CardHeader className="p-0 relative">
                         <Image
                            src={activity.imageUrl}
                            alt={activity.title}
                            width={300}
                            height={150} // Adjust height for better aspect ratio
                            className="w-full h-36 object-cover transition-transform duration-300 group-hover:scale-105"
                            data-ai-hint={activity.aiHint}
                         />
                         {/* Optional: Sponsor logo overlay */}
                         {/* <Image
                            src={activity.sponsorLogoUrl}
                            alt="Sponsor Logo"
                            width={32}
                            height={32}
                            className="absolute bottom-2 right-2 rounded-full border-2 border-background bg-background p-0.5"
                         /> */}
                    </CardHeader>
                    <CardContent className="p-4">
                        <CardTitle className="text-lg font-semibold mb-1 truncate group-hover:text-primary">{activity.title}</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground truncate">{activity.description}</CardDescription>
                    </CardContent>
                   {/* Optional Footer Link */}
                   {/* <CardFooter className="p-3 bg-muted/30">
                        <span className="text-xs text-primary flex items-center">
                            查看詳情 (View Details) <ArrowRight className="h-3 w-3 ml-1" />
                        </span>
                    </CardFooter> */}
               </Link>
            </Card>
          ))}
           {/* Optional: "View All" Card */}
           <div className="flex items-center justify-center w-[150px]">
               <Link href="/activities" className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors">
                   <ArrowRight className="h-8 w-8 mb-2" />
                   <span className="text-sm font-medium">查看全部 (View All)</span>
               </Link>
           </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
