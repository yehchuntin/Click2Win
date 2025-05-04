'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Image from 'next/image'; // Import Image component

export default function SignInPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true); // Start loading until auth state is checked
  const [signInLoading, setSignInLoading] = useState(false);

  useEffect(() => {
    if (!auth) {
      console.warn("Firebase Auth not initialized.");
      setLoading(false); // Stop loading if auth isn't available
      // Optionally show an error message or disable sign-in
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, redirect to home page
        console.log("User already signed in, redirecting...");
        router.push('/');
      } else {
        // User is signed out, stop loading
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]);

  const handleSignInGoogle = async () => {
    if (!auth) {
      toast({ title: "錯誤 (Error)", description: "驗證服務未初始化。(Authentication service not initialized.)", variant: "destructive" });
      return;
    }
    setSignInLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // Redirect is handled by onAuthStateChanged listener
       toast({ title: "登入成功 (Sign In Successful)", description: "即將跳轉至主頁。(Redirecting to home page...)" });
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
       let description = "登入時發生錯誤，請稍後再試。(An error occurred during sign-in. Please try again later.)";
       if (error.code === 'auth/popup-closed-by-user') {
           description = "登入彈窗已關閉。(Sign-in popup closed.)";
       } else if (error.code === 'auth/cancelled-popup-request') {
           description = "已取消登入請求。(Sign-in request cancelled.)";
       }
       toast({
         title: "登入失敗 (Sign-In Failed)",
         description: description,
         variant: "destructive",
      });
      setSignInLoading(false);
    }
    // No need to setSignInLoading(false) on success because redirection will happen
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-secondary to-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-black">
       {/* Background with subtle animation or texture */}
       <div className="absolute inset-0 bg-[url('/path-to-subtle-pattern.svg')] opacity-10 mix-blend-overlay"></div>

      <Card className="w-full max-w-md bg-card/80 backdrop-blur-lg border-border/30 shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="text-center p-8 bg-gradient-to-b from-card/90 to-card/70">
           {/* Optional: Add a subtle, mysterious graphic or logo */}
          <div className="flex justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-primary opacity-80">
                 <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-2.625 6c-.54 0-.828.419-.936.634a1.96 1.96 0 0 0-.189.866c0 .298.059.605.189.866.108.215.395.634.936.634h5.25c.54 0 .828-.419.936-.634.13-.26.189-.568.189-.866 0-.298-.059-.605-.189-.866-.108-.215-.395-.634-.936-.634H9.375ZM12 15.75c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3Z" clipRule="evenodd" />
              </svg>
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">加入冒險 (Join the Adventure)</CardTitle>
          <CardDescription className="text-muted-foreground/80 mt-2">登入以開始您的點擊旅程！(Sign in to begin your clicking journey!)</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
           <p className="text-center text-muted-foreground text-sm">
             透過 Google 快速登入。(Sign in quickly with Google.)
           </p>
          <Button
            onClick={handleSignInGoogle}
            disabled={signInLoading}
            className="w-full text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-md transition-transform hover:scale-105"
          >
            {signInLoading ? (
               <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
               // Google Icon SVG
               <svg className="mr-3 h-5 w-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
            )}
            {signInLoading ? '登入中...(Signing In...)' : '使用 Google 登入 (Sign in with Google)'}
          </Button>
           {/* Placeholder for potential future sign-in methods */}
           {/* <Separator className="my-4" />
           <p className="text-center text-xs text-muted-foreground">或其他方式 (Or other methods)</p> */}
        </CardContent>
      </Card>
    </div>
  );
}
