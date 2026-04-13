"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuthStore } from "@/stores/auth-store";
import { useEquipmentStore } from "@/stores/equipment-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { EventStatusBadge } from "@/components/status-badge";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  X,
  ArrowRight,
  Wrench,
  User,
  Calendar,
  AlertTriangle,
  Play,
  CheckCircle
} from "lucide-react";
import Link from "next/link";
import { DowntimeEvent, DowntimeEventStatus, Equipment } from "@edt/shared";
import { formatDistanceToNow, format } from "date-fns";

export default function DowntimeEventsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuthStore();
  const { 
    equipment, 
    downtimeEvents, 
    isLoading, 
    fetchEquipment,
    fetchDowntimeEvents 
  } = useEquipmentStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [selectedEvent, setSelectedEvent] = useState<DowntimeEvent | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"acknowledge" | "start_repair" | "resolve">("acknowledge");
  const [actionNote, setActionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchEquipment();
    fetchDowntimeEvents();
  }, [isAuthenticated, router, fetchEquipment, fetchDowntimeEvents]);

  // Filter events based on tab and search
  const filteredEvents = useMemo(() => {
    let events = [...downtimeEvents];
    
    // Filter by status tab
    if (activeTab === "active") {
      events = events.filter((e) => e.status !== "resolved");
    } else if (activeTab === "resolved") {
      events = events.filter((e) => e.status === "resolved");
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      events = events.filter((e) => {
        const relatedEquipment = equipment.find((eq) => eq.id === e.equipmentId);
        return (
          e.description.toLowerCase().includes(query) ||
          relatedEquipment?.name.toLowerCase().includes(query) ||
          relatedEquipment?.equipmentId.toLowerCase().includes(query)
        );
      });
    }
    
    // Sort by reported date (newest first)
    return events.sort((a, b) => 
      new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
    );
  }, [downtimeEvents, activeTab, searchQuery, equipment]);

  // Get event counts
  const eventCounts = useMemo(() => {
    return {
      all: downtimeEvents.length,
      active: downtimeEvents.filter((e) => e.status !== "resolved").length,
      resolved: downtimeEvents.filter((e) => e.status === "resolved").length,
      reported: downtimeEvents.filter((e) => e.status === "reported").length,
      acknowledged: downtimeEvents.filter((e) => e.status === "acknowledged").length,
      inRepair: downtimeEvents.filter((e) => e.status === "in_repair").length,
    };
  }, [downtimeEvents]);

  const handleAction = async () => {
    if (!selectedEvent || !user) return;

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    toast({
      title: "Action Completed",
      description: `Event ${actionType.replace("_", " ")}d successfully`,
    });
    
    setIsActionDialogOpen(false);
    setActionNote("");
    setIsSubmitting(false);
    setSelectedEvent(null);
    
    // Refresh data
    fetchDowntimeEvents();
  };

  const openActionDialog = (event: DowntimeEvent, action: "acknowledge" | "start_repair" | "resolve") => {
    setSelectedEvent(event);
    setActionType(action);
    setIsActionDialogOpen(true);
  };

  const getActionButton = (event: DowntimeEvent) => {
    const canAcknowledge = event.status === "reported" && user?.role !== "operator";
    const canStartRepair = event.status === "acknowledged" && (user?.role === "technician" || user?.role === "admin");
    const canResolve = event.status === "in_repair" && (user?.role === "technician" || user?.role === "admin" || user?.role === "supervisor");

    if (canAcknowledge) {
      return (
        <Button size="sm" onClick={() => openActionDialog(event, "acknowledge")}>
          <AlertCircle className="mr-2 h-4 w-4" />
          Acknowledge
        </Button>
      );
    }
    
    if (canStartRepair) {
      return (
        <Button size="sm" onClick={() => openActionDialog(event, "start_repair")}>
          <Wrench className="mr-2 h-4 w-4" />
          Start Repair
        </Button>
      );
    }
    
    if (canResolve) {
      return (
        <Button size="sm" variant="outline" onClick={() => openActionDialog(event, "resolve")}>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Resolve
        </Button>
      );
    }
    
    return null;
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Downtime Events</h1>
            <p className="text-muted-foreground">
              Track and manage equipment downtime events
            </p>
          </div>
          <Button asChild>
            <Link href="/report-issue">
              <AlertCircle className="mr-2 h-4 w-4" />
              Report Issue
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total Events"
            count={eventCounts.all}
            color="blue"
            isLoading={isLoading}
          />
          <StatCard
            title="Reported"
            count={eventCounts.reported}
            color="amber"
            isLoading={isLoading}
          />
          <StatCard
            title="Acknowledged"
            count={eventCounts.acknowledged}
            color="blue"
            isLoading={isLoading}
          />
          <StatCard
            title="In Repair"
            count={eventCounts.inRepair}
            color="purple"
            isLoading={isLoading}
          />
          <StatCard
            title="Resolved"
            count={eventCounts.resolved}
            color="green"
            isLoading={isLoading}
          />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events or equipment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="active">
              Active
              <Badge variant="secondary" className="ml-2">
                {eventCounts.active}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved
              <Badge variant="secondary" className="ml-2">
                {eventCounts.resolved}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="all">
              All
              <Badge variant="secondary" className="ml-2">
                {eventCounts.all}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="font-semibold text-lg">
                    {activeTab === "active" ? "No Active Events" : "No Events Found"}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {searchQuery
                      ? "Try adjusting your search to see more results"
                      : activeTab === "active"
                      ? "Great! All downtime events have been resolved"
                      : "No downtime events recorded yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    equipment={equipment}
                    actionButton={getActionButton(event)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Dialog */}
        <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {actionType === "acknowledge" && "Acknowledge Event"}
                {actionType === "start_repair" && "Start Repair"}
                {actionType === "resolve" && "Resolve Event"}
              </DialogTitle>
              <DialogDescription>
                {selectedEvent && (
                  <>
                    Event for{" "}
                    {equipment.find((e) => e.id === selectedEvent.equipmentId)?.name || "Unknown Equipment"}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Add notes about this action..."
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAction} disabled={isSubmitting}>
                {isSubmitting && <Clock className="mr-2 h-4 w-4 animate-spin" />}
                {actionType === "acknowledge" && "Acknowledge"}
                {actionType === "start_repair" && "Start Repair"}
                {actionType === "resolve" && "Resolve"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

interface StatCardProps {
  title: string;
  count: number;
  color: "blue" | "green" | "amber" | "purple" | "red";
  isLoading: boolean;
}

function StatCard({ title, count, color, isLoading }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    red: "bg-red-50 border-red-200 text-red-700",
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={colorClasses[color]}>
      <CardContent className="p-6">
        <p className="text-sm font-medium opacity-80">{title}</p>
        <p className="text-3xl font-bold mt-1">{count}</p>
      </CardContent>
    </Card>
  );
}

interface EventCardProps {
  event: DowntimeEvent;
  equipment: Equipment[];
  actionButton: React.ReactNode;
}

function EventCard({ event, equipment, actionButton }: EventCardProps) {
  const relatedEquipment = equipment.find((e) => e.id === event.equipmentId);
  const timeAgo = formatDistanceToNow(new Date(event.reportedAt), { addSuffix: true });
  const reportedAt = format(new Date(event.reportedAt), "MMM d, yyyy h:mm a");

  const statusConfig = {
    reported: { icon: <AlertCircle className="h-5 w-5" />, bg: "bg-amber-50", border: "border-amber-200" },
    acknowledged: { icon: <Clock className="h-5 w-5" />, bg: "bg-blue-50", border: "border-blue-200" },
    in_repair: { icon: <Wrench className="h-5 w-5" />, bg: "bg-purple-50", border: "border-purple-200" },
    resolved: { icon: <CheckCircle2 className="h-5 w-5" />, bg: "bg-green-50", border: "border-green-200" },
    escalated: { icon: <AlertTriangle className="h-5 w-5" />, bg: "bg-red-50", border: "border-red-200" },
  };

  const config = statusConfig[event.status];

  return (
    <Card className={`${config.bg} ${config.border}`}>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="mt-1">{config.icon}</div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="font-semibold">
                  {relatedEquipment?.name || "Unknown Equipment"}
                </h3>
                <EventStatusBadge status={event.status} size="sm" />
                <Badge variant={event.severity === "critical" ? "destructive" : "secondary"}>
                  {event.severity}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {event.description}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Settings className="h-4 w-4" />
                  {relatedEquipment?.equipmentId || "N/A"}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {reportedAt}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Reported {timeAgo}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {actionButton}
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/equipment/${event.equipmentId}`}>
                View Equipment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
