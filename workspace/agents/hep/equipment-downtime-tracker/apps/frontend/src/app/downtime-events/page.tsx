"use client";

import { useEffect, useState } from "react";
import { useEquipmentStore } from "@/stores/equipment-store";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/lib/api-client";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  Wrench,
  AlertTriangle,
  Search,
  Filter,
  ChevronRight,
  User,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { DowntimeEvent, DowntimeEventStatus } from "@edt/shared";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function DowntimeEventsPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { equipment, fetchEquipment, downtimeEvents, fetchDowntimeEvents } = useEquipmentStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DowntimeEventStatus | "all">("all");
  const [selectedEvent, setSelectedEvent] = useState<DowntimeEvent | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"acknowledge" | "start-repair" | "resolve" | null>(null);
  const [workLog, setWorkLog] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTechnician = user?.role === "technician";
  const isSupervisor = user?.role === "supervisor";
  const isAdmin = user?.role === "admin";
  const canManageEvents = isTechnician || isSupervisor || isAdmin;

  useEffect(() => {
    fetchEquipment();
    fetchDowntimeEvents();
  }, [fetchEquipment, fetchDowntimeEvents]);

  // Filter events
  const filteredEvents = downtimeEvents.filter((event) => {
    const eq = equipment.find((e) => e.id === event.equipmentId);
    const matchesSearch =
      eq?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.issueType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeEvents = filteredEvents.filter((e) => e.status !== "resolved" && e.status !== "escalated");
  const resolvedEvents = filteredEvents.filter((e) => e.status === "resolved" || e.status === "escalated");

  const getEquipmentName = (equipmentId: string) => {
    const eq = equipment.find((e) => e.id === equipmentId);
    return eq?.name || "Unknown Equipment";
  };

  const handleEventAction = async () => {
    if (!selectedEvent || !actionType) return;

    setIsSubmitting(true);
    try {
      let endpoint = "";
      let payload: any = {};

      switch (actionType) {
        case "acknowledge":
          endpoint = `/downtime-events/${selectedEvent.id}/acknowledge`;
          payload = { technicianId: user?.id };
          break;
        case "start-repair":
          endpoint = `/downtime-events/${selectedEvent.id}/start-repair`;
          payload = { technicianId: user?.id };
          break;
        case "resolve":
          endpoint = `/downtime-events/${selectedEvent.id}/resolve`;
          payload = { 
            technicianId: user?.id,
            workLog: workLog || undefined
          };
          break;
      }

      await apiClient.patch(endpoint, payload);

      toast({
        title: "Success",
        description: `Event ${actionType === "acknowledge" ? "acknowledged" : actionType === "start-repair" ? "repair started" : "resolved"} successfully.`,
      });

      setActionDialogOpen(false);
      setWorkLog("");
      setSelectedEvent(null);
      fetchDowntimeEvents();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openActionDialog = (event: DowntimeEvent, action: "acknowledge" | "start-repair" | "resolve") => {
    setSelectedEvent(event);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const renderEventCard = (event: DowntimeEvent, showActions = false) => (
    <Card key={event.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link href={`/equipment/${event.equipmentId}`}>
                <span className="font-semibold hover:text-blue-600 transition-colors">
                  {getEquipmentName(event.equipmentId)}
                </span>
              </Link>
              <StatusBadge status={event.status} type="event" size="sm" />
            </div>
            
            <p className="text-sm text-gray-600 mb-2">{event.issueType}</p>
            
            {event.description && (
              <p className="text-sm text-gray-500 line-clamp-2 mb-2">{event.description}</p>
            )}
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Reported {new Date(event.reportedAt).toLocaleString()}
              </span>
              {event.acknowledgedAt && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Acknowledged
                </span>
              )}
              {event.resolvedAt && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Resolved {new Date(event.resolvedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {showActions && canManageEvents && (
            <div className="flex flex-col gap-2 ml-4">
              {event.status === "reported" && (
                <Button
                  size="sm"
                  onClick={() => openActionDialog(event, "acknowledge")}
                >
                  Acknowledge
                </Button>
              )}
              {event.status === "acknowledged" && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openActionDialog(event, "start-repair")}
                >
                  <Wrench className="h-3 w-3 mr-1" />
                  Start Repair
                </Button>
              )}
              {(event.status === "in_repair" || event.status === "acknowledged") && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openActionDialog(event, "resolve")}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Resolve
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Downtime Events</h1>
              <Link href="/report-issue">
                <Button>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Report Issue
                </Button>
              </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as DowntimeEventStatus | "all")}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="reported">Reported</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="in_repair">In Repair</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">
              Active ({activeEvents.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({resolvedEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeEvents.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
                <p className="text-gray-500">No active downtime events at the moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeEvents.map((event) => renderEventCard(event, true))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4">
            {resolvedEvents.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Resolved Events</h3>
                <p className="text-gray-500">No events have been resolved yet.</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {resolvedEvents.map((event) => renderEventCard(event))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "acknowledge" && "Acknowledge Event"}
              {actionType === "start-repair" && "Start Repair"}
              {actionType === "resolve" && "Resolve Event"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedEvent && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{getEquipmentName(selectedEvent.equipmentId)}</p>
                <p className="text-sm text-gray-500">{selectedEvent.issueType}</p>
              </div>
            )}

            {actionType === "resolve" && (
              <div className="space-y-2">
                <Label>Work Log (Optional)</Label>
                <Textarea
                  placeholder="Describe what was done to resolve the issue..."
                  value={workLog}
                  onChange={(e) => setWorkLog(e.target.value)}
                  rows={4}
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setActionDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleEventAction}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Confirm"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
