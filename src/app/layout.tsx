
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Use Inter or keep Geist
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster
// Removed AppBar import: import { AppBar } from '@/components/layout/app-bar';
import { AuthProvider } from '@/hooks/use-auth'; // Import AuthProvider

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
         <AuthProvider> {/* Wrap content with AuthProvider */}
           {/* Removed AppBar */}
           {/* Adjust main padding since AppBar is removed */}
           <main className="flex-1 pt-4"> {/* Reduced padding-top */}
                {children}
           </main>
           <Toaster /> {/* Add Toaster component here */}
         </AuthProvider>
      </body>
    </html>
  );
}
