"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuthStore } from "@/stores/auth-store";
import { useEquipmentStore } from "@/stores/equipment-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { EquipmentStatusBadge } from "@/components/status-badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  Settings,
  MapPin,
  Activity,
  Wrench,
  ChevronRight,
  History,
  Edit3,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { Equipment, EquipmentStatus, DowntimeEvent } from "@edt/shared";
import { equipmentStatusConfig } from "@/lib/status-config";
import { formatDistanceToNow } from "date-fns";

export default function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuthStore();
  const { 
    equipment, 
    downtimeEvents,
    isLoading, 
    fetchEquipment,
    fetchDowntimeEvents,
    updateEquipmentStatus 
  } = useEquipmentStore();

  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<EquipmentStatus>(EquipmentStatus.RUNNING);
  const [statusReason, setStatusReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [equipmentId, setEquipmentId] = useState<string>("");

  // Unwrap params
  useEffect(() => {
    params.then(p => setEquipmentId(p.id));
  }, [params]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    
    fetchEquipment();
    fetchDowntimeEvents();
  }, [isAuthenticated, router, fetchEquipment, fetchDowntimeEvents]);

  useEffect(() => {
    if (equipment.length > 0 && equipmentId) {
      const found = equipment.find((e) => e.id === equipmentId);
      setSelectedEquipment(found || null);
    }
  }, [equipment, equipmentId]);

  const handleStatusUpdate = async () => {
    if (!selectedEquipment) return;
    
    setIsUpdating(true);
    try {
      await updateEquipmentStatus(selectedEquipment.id, newStatus, statusReason);
      toast({
        title: "Status Updated",
        description: `Equipment status changed to ${newStatus}`,
      });
      setIsStatusDialogOpen(false);
      setStatusReason("");
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update equipment status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Get equipment-specific events
  const equipmentEvents = downtimeEvents.filter(
    (e) => e.equipmentId === equipmentId
  ).sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());

  const activeEvents = equipmentEvents.filter((e) => e.status !== "resolved");

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading || !selectedEquipment) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-64 lg:col-span-2" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Navigation */}
        <Button variant="ghost" asChild className="-ml-4">
          <Link href="/equipment">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Equipment
          </Link>
        </Button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-gray-100 flex items-center justify-center">
              <Settings className="h-8 w-8 text-gray-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{selectedEquipment.name}</h1>
              <p className="text-muted-foreground">
                ID: {selectedEquipment.equipmentId} • {selectedEquipment.type}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setNewStatus(selectedEquipment.status);
                setIsStatusDialogOpen(true);
              }}
            >
              <Edit3 className="mr-2 h-4 w-4" />
              Update Status
            </Button>
            <Button asChild>
              <Link href={`/report-issue?equipment=${selectedEquipment.id}`}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Report Issue
              </Link>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Equipment Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
                <CardDescription>Real-time equipment status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      selectedEquipment.status === "running" ? "bg-green-100" :
                      selectedEquipment.status === "degraded" ? "bg-yellow-100" :
                      selectedEquipment.status === "down" ? "bg-red-100" : "bg-gray-100"
                    }`}>
                      {selectedEquipment.status === "running" ? <CheckCircle2 className="h-6 w-6 text-green-600" /> :
                       selectedEquipment.status === "degraded" ? <Activity className="h-6 w-6 text-yellow-600" /> :
                       selectedEquipment.status === "down" ? <AlertCircle className="h-6 w-6 text-red-600" /> :
                       <Clock className="h-6 w-6 text-gray-600" />}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Status</p>
                      <EquipmentStatusBadge status={selectedEquipment.status} size="lg" />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">
                      {formatDistanceToNow(new Date(selectedEquipment.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Downtime Events */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Downtime Events</CardTitle>
                  <CardDescription>History of reported issues</CardDescription>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/downtime-events">
                    View All
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {equipmentEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                    <h3 className="font-semibold">No Events</h3>
                    <p className="text-sm text-muted-foreground">
                      This equipment has no downtime events
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {equipmentEvents.slice(0, 5).map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Info & Quick Actions */}
          <div className="space-y-6">
            {/* Equipment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{selectedEquipment.type}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Equipment ID</p>
                  <p className="font-medium">{selectedEquipment.equipmentId}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Zone</p>
                  <p className="font-medium">{selectedEquipment.zoneId}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(selectedEquipment.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Active Events Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Active Events</CardTitle>
              </CardHeader>
              <CardContent>
                {activeEvents.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No active events</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-yellow-200 bg-yellow-50"
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium">{event.status}</span>
                        </div>
                        <Badge variant="outline">
                          {event.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setNewStatus(EquipmentStatus.RUNNING);
                    setIsStatusDialogOpen(true);
                  }}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  Mark as Running
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setNewStatus(EquipmentStatus.DEGRADED);
                    setIsStatusDialogOpen(true);
                  }}
                >
                  <Activity className="mr-2 h-4 w-4 text-yellow-500" />
                  Mark as Degraded
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setNewStatus(EquipmentStatus.DOWN);
                    setIsStatusDialogOpen(true);
                  }}
                >
                  <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                  Mark as Down
                </Button>
                <Separator className="my-2" />
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/report-issue?equipment=${selectedEquipment.id}`}>
                    <Wrench className="mr-2 h-4 w-4" />
                    Report Issue
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Status Update Dialog */}
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Update Equipment Status</DialogTitle>
              <DialogDescription>
                Change the status for {selectedEquipment?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">New Status</label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as EquipmentStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="running">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        Running
                      </span>
                    </SelectItem>
                    <SelectItem value="degraded">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-yellow-500" />
                        Degraded
                      </span>
                    </SelectItem>
                    <SelectItem value="down">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        Down
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason (Optional)</label>
                <Textarea
                  placeholder="Enter reason for status change..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleStatusUpdate} disabled={isUpdating}>
                {isUpdating && <Clock className="mr-2 h-4 w-4 animate-spin" />}
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

interface EventCardProps {
  event: DowntimeEvent;
}

function EventCard({ event }: EventCardProps) {
  const statusColors = {
    reported: "bg-amber-50 border-amber-200",
    acknowledged: "bg-blue-50 border-blue-200",
    in_repair: "bg-purple-50 border-purple-200",
    resolved: "bg-green-50 border-green-200",
    escalated: "bg-red-50 border-red-200",
  };

  const statusIcons = {
    reported: <AlertCircle className="h-4 w-4 text-amber-600" />,
    acknowledged: <Clock className="h-4 w-4 text-blue-600" />,
    in_repair: <Wrench className="h-4 w-4 text-purple-600" />,
    resolved: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    escalated: <AlertTriangle className="h-4 w-4 text-red-600" />,
  };

  return (
    <Link href={`/downtime-events`}>
      <div className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow ${statusColors[event.status]}`}>
        <div className="mt-0.5">{statusIcons[event.status]}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {event.severity}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(event.reportedAt), { addSuffix: true })}
            </span>
          </div>
          <p className="mt-2 text-sm">{event.description}</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {event.status}
            </Badge>
          </div>
        </div>
      </div>
    </Link>
  );
}
