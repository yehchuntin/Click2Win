
import type {Metadata} from 'next';
import {Inter} from 'next/font/google'; // Use Inter or keep Geist
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster
import { AuthDisplay } from '@/components/auth/auth-display'; // Import the new AuthDisplay component

const inter = Inter({ subsets: ['latin'] }); // Example using Inter

// If keeping Geist:
// import { Geist, Geist_Mono } from 'next/font/google';
// const geistSans = Geist({
//   variable: '--font-geist-sans',
//   subsets: ['latin'],
// });
// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// });
// const fontVariables = `${geistSans.variable} ${geistMono.variable}`;

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
    <html lang="en">
      {/* Use appropriate font class based on your choice */}
      <body className={`${inter.className} antialiased flex flex-col min-h-screen`}>
        {/* Or if using Geist: <body className={`${fontVariables} antialiased flex flex-col min-h-screen`}> */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-end">
                 <AuthDisplay /> {/* Use the new AuthDisplay component */}
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
