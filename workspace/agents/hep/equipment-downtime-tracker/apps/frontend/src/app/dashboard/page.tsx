"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuthStore } from "@/stores/auth-store";
import { useEquipmentStore } from "@/stores/equipment-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EquipmentStatusBadge } from "@/components/status-badge";
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Plus,
  Settings,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import Link from "next/link";
import { EquipmentStatus, DowntimeEvent, Equipment } from "@edt/shared";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { 
    equipment, 
    downtimeEvents, 
    isLoading, 
    fetchEquipment, 
    fetchDowntimeEvents 
  } = useEquipmentStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    
    fetchEquipment();
    fetchDowntimeEvents();
  }, [isAuthenticated, router, fetchEquipment, fetchDowntimeEvents]);

  // Calculate statistics
  const stats = {
    running: equipment.filter((e) => e.status === "running").length,
    degraded: equipment.filter((e) => e.status === "degraded").length,
    down: equipment.filter((e) => e.status === "down").length,
    total: equipment.length,
    openEvents: downtimeEvents.filter((e) => e.status !== "resolved").length,
  };

  // Get currently down equipment
  const downEquipment = equipment.filter((e) => e.status === "down");

  // Get recent events (last 24 hours)
  const recentEvents = downtimeEvents
    .filter((e) => {
      const eventDate = new Date(e.reportedAt);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return eventDate >= yesterday;
    })
    .slice(0, 5);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.name}. Here's your equipment overview.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/equipment">
                <Settings className="mr-2 h-4 w-4" />
                View Equipment
              </Link>
            </Button>
            <Button asChild>
              <Link href="/report-issue">
                <Plus className="mr-2 h-4 w-4" />
                Report Issue
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatusCard
            title="Running"
            count={stats.running}
            total={stats.total}
            icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
            trend="up"
            color="green"
            isLoading={isLoading}
          />
          <StatusCard
            title="Degraded"
            count={stats.degraded}
            total={stats.total}
            icon={<Activity className="h-4 w-4 text-yellow-500" />}
            trend="neutral"
            color="yellow"
            isLoading={isLoading}
          />
          <StatusCard
            title="Down"
            count={stats.down}
            total={stats.total}
            icon={<AlertCircle className="h-4 w-4 text-red-500" />}
            trend="down"
            color="red"
            isLoading={isLoading}
          />
          <StatusCard
            title="Open Events"
            count={stats.openEvents}
            total={downtimeEvents.length}
            icon={<Clock className="h-4 w-4 text-blue-500" />}
            trend="neutral"
            color="blue"
            isLoading={isLoading}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Currently Down Equipment */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Currently Down</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Equipment requiring immediate attention
                </p>
              </div>
              <Badge variant="secondary">{downEquipment.length} items</Badge>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : downEquipment.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="font-semibold">All Systems Operational</h3>
                  <p className="text-sm text-muted-foreground">
                    No equipment is currently down
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {downEquipment.map((equipment) => (
                    <div
                      key={equipment.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-red-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <Settings className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium">{equipment.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {equipment.equipmentId}
                          </p>
                        </div>
                      </div>
                      <EquipmentStatusBadge status={equipment.status} size="sm" />
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="ghost"
                className="w-full mt-4"
                asChild
              >
                <Link href="/downtime-events">
                  View all downtime events
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Downtime events from the last 24 hours
                </p>
              </div>
              <Badge variant="secondary">{recentEvents.length} events</Badge>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : recentEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold">No Recent Events</h3>
                  <p className="text-sm text-muted-foreground">
                    No downtime events reported in the last 24 hours
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentEvents.map((event) => (
                    <RecentEventCard key={event.id} event={event} equipment={equipment} />
                  ))}
                </div>
              )}
              <Button
                variant="ghost"
                className="w-full mt-4"
                asChild
              >
                <Link href="/downtime-events">
                  View all events
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/report-issue">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Report Issue
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/equipment">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Equipment
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/downtime-events">
                  <Activity className="mr-2 h-4 w-4" />
                  View Events
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

interface StatusCardProps {
  title: string;
  count: number;
  total: number;
  icon: React.ReactNode;
  trend: "up" | "down" | "neutral";
  color: "green" | "yellow" | "red" | "blue";
  isLoading: boolean;
}

function StatusCard({ title, count, total, icon, trend, color, isLoading }: StatusCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  
  const colorClasses = {
    green: "bg-green-50 border-green-200",
    yellow: "bg-yellow-50 border-yellow-200",
    red: "bg-red-50 border-red-200",
    blue: "bg-blue-50 border-blue-200",
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-12 w-16 mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={colorClasses[color]}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-3xl font-bold">{count}</h3>
              {total > 0 && (
                <span className="text-sm text-muted-foreground">
                  / {total}
                </span>
              )}
            </div>
          </div>
          <div className="p-2 bg-background rounded-full border">
            {icon}
          </div>
        </div>
        <div className="flex items-center gap-1 mt-4 text-sm">
          <TrendIcon className="h-4 w-4" />
          <span className="text-muted-foreground">
            {total > 0 ? Math.round((count / total) * 100) : 0}% of total
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

interface RecentEventCardProps {
  event: DowntimeEvent;
  equipment: Equipment[];
}

function RecentEventCard({ event, equipment }: RecentEventCardProps) {
  const relatedEquipment = equipment.find((e) => e.id === event.equipmentId);
  const timeAgo = getTimeAgo(new Date(event.reportedAt));

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
      <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
        <AlertCircle className="h-5 w-5 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">
            {relatedEquipment?.name || "Unknown Equipment"}
          </p>
          <Badge variant="outline" className="shrink-0 text-xs">
            {event.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {event.description}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}
