
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger, // Keep if triggered differently later
  DialogClose, // Import if needed
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { auth } from '@/lib/firebase/client';
import { GoogleAuthProvider, FacebookAuthProvider, OAuthProvider, signInWithPopup, AuthError } from "firebase/auth";
import { LogIn } from 'lucide-react'; // Optional: for icons
import { useToast } from "@/hooks/use-toast";

// REMINDER: Enable Google, Apple, and Facebook sign-in providers
// in your Firebase project console under Authentication > Sign-in method.
// You'll need to configure OAuth credentials for each.

interface SignInModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SignInModal({ isOpen, onOpenChange }: SignInModalProps) {
    const { toast } = useToast();

    const handleSignIn = async (provider: GoogleAuthProvider | FacebookAuthProvider | OAuthProvider) => {
        if (!auth) {
            toast({ title: "Authentication Error", description: "Firebase not configured.", variant: "destructive" });
            return;
        }
        try {
            await signInWithPopup(auth, provider);
            // onOpenChange(false); // Close modal on success (handled by AuthDisplay's useEffect)
        } catch (error: unknown) {
            const authError = error as AuthError; // Type assertion
            console.error(`Error during ${provider.providerId} Sign-In:`, authError);
            let description = "An unknown error occurred. Please try again.";
             // Handle specific errors (e.g., account exists with different credential)
             if (authError.code === 'auth/account-exists-with-different-credential') {
                description = "An account already exists with the same email address but different sign-in credentials. Try signing in using the original method.";
            } else if (authError.code === 'auth/popup-closed-by-user') {
                description = "Sign-in popup closed before completion.";
            } else if (authError.code === 'auth/cancelled-popup-request') {
                description = "Multiple sign-in requests were made. Please try again.";
            }
            toast({
                title: "Sign-In Failed",
                description: description,
                variant: "destructive",
            });
        }
    };

    const handleSignInGoogle = () => handleSignIn(new GoogleAuthProvider());
    const handleSignInFacebook = () => handleSignIn(new FacebookAuthProvider());
    const handleSignInApple = () => handleSignIn(new OAuthProvider('apple.com')); // Use OAuthProvider for Apple

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Sign In / Sign Up</DialogTitle>
                    <DialogDescription>
                        Choose a provider to sign in or create an account.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* TODO: Add better icons */}
                    {/* Comment out Google Sign-in Button */}
                    {/*
                    <Button onClick={handleSignInGoogle} variant="outline">
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
                        Sign in with Google
                    </Button>
                    */}
                     <Button onClick={handleSignInFacebook} variant="outline" className="bg-[#1877F2] text-white hover:bg-[#1877F2]/90 hover:text-white">
                         <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-1.5c-.83 0-1.5.67-1.5 1.5V12h3l-.5 3h-2.5v6.8c4.56-.93 8-4.96 8-9.8z"></path></svg>
                         Sign in with Facebook
                     </Button>
                     <Button onClick={handleSignInApple} variant="outline" className="bg-black text-white hover:bg-black/90 hover:text-white">
                         <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.67 14.85c-.37.88-.93 1.59-1.84 1.62-.87.03-1.17-.52-2.15-.52-.97 0-1.31.52-2.18.54-.95.03-1.63-.75-2.03-1.64-.95-2.13-.24-5.31 1.67-7.06 1.03-.95 2.15-1.5 3.53-1.51 1.24-.01 2.68.78 3.62 1.74-.11.07-2.11 1.3-2.11 3.21 0 2.36 2.49 3.4 2.49 3.4zm-1.32-6.89c.64-.73 1.05-1.77.96-2.81-.8.09-1.92.58-2.57 1.3-.59.67-1.12 1.76-1.01 2.73.95.05 1.98-.49 2.62-1.22z"></path></svg>
                         Sign in with Apple
                     </Button>
                </div>
                {/* Optional Footer */}
                {/* <DialogFooter>
                    <DialogClose asChild>
                         <Button type="button" variant="secondary">Cancel</Button>
                     </DialogClose>
                </DialogFooter> */}
            </DialogContent>
        </Dialog>
    );
}
