"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Settings,
  Wrench,
  AlertCircle,
  Menu,
  LogOut,
  ChevronRight,
  Activity,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

interface SidebarProps {
  className?: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "Equipment",
    href: "/equipment",
    icon: <Settings className="h-5 w-5" />,
  },
  {
    title: "Downtime Events",
    href: "/downtime-events",
    icon: <Activity className="h-5 w-5" />,
  },
  {
    title: "Report Issue",
    href: "/report-issue",
    icon: <AlertCircle className="h-5 w-5" />,
    roles: ["operator", "technician", "supervisor", "admin"],
  },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {navItems.map((item) => {
        // Filter by role if specified
        if (item.roles && user && !item.roles.includes(user.role)) {
          return null;
        }

        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent",
              isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"
            )}
          >
            {item.icon}
            <span>{item.title}</span>
            {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b px-4 py-3 flex items-center justify-between">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="flex items-center gap-2">
                <Wrench className="h-6 w-6" />
                <span>EDTTS</span>
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col h-[calc(100vh-140px)]">
              <ScrollArea className="flex-1 p-4">
                <nav className="flex flex-col gap-2">
                  <NavLinks onClick={() => setMobileMenuOpen(false)} />
                </nav>
              </ScrollArea>
              {user && (
                <div className="p-4 border-t">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{user.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
        <div className="font-semibold">EDTTS</div>
        <div className="w-10" />
      </div>

      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden lg:flex flex-col w-64 bg-background border-r h-screen sticky top-0",
          className
        )}
      >
        <div className="p-6 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            <span className="font-bold text-xl">EDTTS</span>
          </Link>
          <p className="text-xs text-muted-foreground mt-1">
            Equipment Downtime Tracker
          </p>
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            <NavLinks />
          </nav>
        </ScrollArea>

        <div className="p-4 border-t">
          {user && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{user.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {user.role}
                  </span>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
