'use client';

import { useState, useEffect } from 'react';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase/client'; // Import initialized auth
import { isFirebaseConfigured } from '@/lib/firebase/config'; // Correct import path
import { LogIn, LogOut, User as UserIcon, AlertTriangle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


export function GoogleSignInButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
        setLoading(false);
        return; // Don't run if Firebase isn't configured
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      // TODO: Potentially update global state or context here
       if (currentUser) {
           console.log("User signed in:", currentUser.uid, currentUser.displayName);
           // You might want to call an action here to ensure the user exists
           // in your backend database (e.g., src/services/account.ts)
           // ensureUserExists(currentUser.uid, currentUser.displayName || '', currentUser.email || '');
       } else {
            console.log("User signed out");
       }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);


  const handleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // State update will be handled by onAuthStateChanged
    } catch (error) {
      console.error("Error during Google Sign-In:", error);
      // TODO: Show error toast to user
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
       // State update will be handled by onAuthStateChanged
    } catch (error) {
      console.error("Error during Sign Out:", error);
       // TODO: Show error toast to user
    }
  };

  if (!isFirebaseConfigured) {
     return (
        <Button variant="destructive" disabled size="sm">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Firebase Not Configured
        </Button>
     );
  }

  if (loading) {
    return <Button variant="outline" disabled size="sm">Loading...</Button>;
  }

  if (user) {
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
           {/* <DropdownMenuItem>
               <User className="mr-2 h-4 w-4" />
               <span>Profile</span>
           </DropdownMenuItem> */}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
             <LogOut className="mr-2 h-4 w-4" />
             <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button onClick={handleSignIn} variant="outline" size="sm">
        <LogIn className="mr-2 h-4 w-4" />
        Sign in with Google
    </Button>
  );
}
