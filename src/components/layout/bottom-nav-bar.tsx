'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, BarChart3, Settings, ReceiptText } from 'lucide-react'; // Added ReceiptText for Activity Log
import { cn } from '@/lib/utils';

// Define navigation items
const navItems = [
  { href: '/', label: '首頁 (Home)', icon: Home },
  { href: '/leaderboard', label: '排行榜 (Rank)', icon: BarChart3 }, // Changed icon
  { href: '/activity-log', label: '活動紀錄 (Log)', icon: ReceiptText }, // Added Activity Log
  { href: '/settings', label: '設定 (Settings)', icon: Settings },
];

export function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 h-16 md:hidden"> {/* Hide on medium screens and up */}
      <div className="container mx-auto flex h-full items-center justify-around max-w-md">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 text-xs font-medium transition-colors p-2 rounded-md",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className={cn("h-5 w-5 mb-0.5", isActive ? "text-primary" : "")} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
