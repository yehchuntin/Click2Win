import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster
import { GoogleSignInButton } from '@/components/auth/google-signin-button'; // Import the new button

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Click2Win', // Updated title
  description: 'Click to win rewards!', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Apply dark class by default if :root styling isn't sufficient or preferred
    // <html lang="en" className="dark">
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-end">
                 <GoogleSignInButton />
            </div>
        </header>
        <main className="flex-1">
             {children}
        </main>
        <Toaster /> {/* Add Toaster component here */}
      </body>
    </html>
  );
}
