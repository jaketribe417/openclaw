"use client";

import { Sidebar } from "./sidebar";
import { useRealtimeStore } from "@/stores/realtime-store";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isConnected } = useRealtimeStore();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-screen lg:ml-0 mt-14 lg:mt-0">
        {/* Real-time connection status */}
        <div className="h-1 bg-gray-100 dark:bg-gray-800">
          <div
            className={cn(
              "h-full transition-all duration-500",
              isConnected ? "bg-green-500 w-full" : "bg-red-500 w-1/3 animate-pulse"
            )}
          />
        </div>
        
        {/* Connection indicator */}
        <div className="px-4 py-2 flex justify-end items-center gap-2 text-xs text-muted-foreground border-b">
          {isConnected ? (
            <>
              <Wifi className="h-3 w-3 text-green-500" />
              <span className="text-green-600">Real-time updates connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-red-500" />
              <span className="text-red-600">Disconnected - refresh to reconnect</span>
            </>
          )}
        </div>

        <div className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
