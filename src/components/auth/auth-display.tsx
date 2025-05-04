
'use client';

import { useState } from 'react'; // Only useState needed now
import { Button } from '@/components/ui/button';
import { auth, signOut } from '@/lib/firebase/client'; // Import signOut
import { isFirebaseConfigured } from '@/lib/firebase/config';
import { LogIn, LogOut, User as UserIcon, Loader2, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignInModal } from './sign-in-modal';
import { useAuth } from '@/hooks/use-auth'; // Import the useAuth hook
// Removed ensureUserExists import: import { ensureUserExists } from '@/services/account';

export function AuthDisplay() {
  const { user, loading } = useAuth(); // Use the hook to get user and loading state
  const [isModalOpen, setIsModalOpen] = useState(false);

   // Removed client-side ensureUserExists useEffect block
    // useEffect(() => {
    //     if (user) {
    //          console.log("AuthDisplay: User logged in, ensuring existence in DB:", user.uid);
    //          // This should ideally be handled server-side or via API on login/first interaction
    //          // ensureUserExists(user.uid) // Pass relevant user info if needed
    //          //   .then(() => console.log(`User ${user.uid} ensured in DB.`))
    //          //   .catch(err => console.error(`Error ensuring user ${user.uid} exists:`, err));
    //     }
    // }, [user]);


  const handleSignOut = async () => {
    if (!auth) return;
    try {
       await signOut(auth); // Call signOut directly
       // Auth state change is handled by the useAuth hook's onAuthStateChanged listener
       // Clear localStorage on explicit sign-out
       localStorage.removeItem('userUID');
       console.log("User signed out via AuthDisplay button. UID removed from localStorage.");
    } catch (error) {
      console.error("Error during Sign Out:", error);
       // TODO: Show error toast to user
    }
  };

  // Render warning if Firebase is not configured
  if (!isFirebaseConfigured) {
     console.warn("AuthDisplay: Firebase not configured. Hiding component.");
     // Optional: Render a small warning indicator instead of null
     return (
        <div className="flex items-center text-xs text-destructive-foreground bg-destructive p-1 rounded">
            <AlertTriangle className="h-3 w-3 mr-1" /> Config Error
        </div>
     );
  }

  if (loading) {
    // Show a loading indicator while checking auth state
    return <Button variant="ghost" disabled size="sm"><Loader2 className="h-4 w-4 animate-spin" /></Button>;
  }

  if (user) {
    // User is logged in, show avatar and dropdown
    return (
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
           <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                <AvatarFallback>
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
                </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* Add other menu items here if needed (e.g., Profile, Settings) */}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
             <LogOut className="mr-2 h-4 w-4" />
             <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // User is not logged in, show Sign In button triggering the modal
  return (
     <>
        <Button onClick={() => setIsModalOpen(true)} variant="outline" size="sm">
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
        </Button>
        {/* Pass user state to potentially close modal on successful sign-in */}
        <SignInModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
     </>
  );
}
