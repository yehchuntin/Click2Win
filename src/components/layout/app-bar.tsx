'use client';

import { AuthDisplay } from '@/components/auth/auth-display'; // Assuming this handles login/user display
import { Button } from '@/components/ui/button';
import { Gift } from 'lucide-react';
import Link from 'next/link';

export function AppBar() {
  // TODO: Fetch user's reward balance if needed, or pass as prop
  const userRewardBalance = 0; // Placeholder

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
         {/* Left side - maybe Logo or App Name */}
         <Link href="/" className="flex items-center space-x-2">
            {/* Placeholder for logo */}
            {/* <span className="font-bold text-primary">Click2Win</span> */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-primary">
             <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-2.625 6c-.54 0-.828.419-.936.634a1.96 1.96 0 0 0-.189.866c0 .298.059.605.189.866.108.215.395.634.936.634h5.25c.54 0 .828-.419.936-.634.13-.26.189-.568.189-.866 0-.298-.059-.605-.189-.866-.108-.215-.395-.634-.936-.634H9.375ZM12 15.75c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3Z" clipRule="evenodd" />
          </svg>
          <span className="font-bold hidden sm:inline-block">Click2Win</span>
        </Link>

        {/* Right side - User Actions */}
        <div className="flex items-center space-x-4">
          {/* My Rewards Button (visible when logged in) */}
           {/* TODO: Conditionally render this based on auth state */}
           <Button variant="ghost" size="sm" asChild>
            <Link href="/my-rewards"> {/* Adjust link as needed */}
              <Gift className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">我的獎勵 (My Rewards)</span>
              {/* Optional: Show balance */}
              {/* <span className="ml-1">(${userRewardBalance})</span> */}
            </Link>
          </Button>

          {/* Authentication Display */}
          <AuthDisplay />
        </div>
      </div>
    </header>
  );
}
