"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEquipmentStore } from "@/stores/equipment-store";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/lib/api-client";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  AlertCircle,
  Clock,
  Activity,
  Wrench,
  History,
  Settings,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Equipment, EquipmentStatus, Module, Component, DowntimeEvent } from "@edt/shared";
import { useToast } from "@/hooks/use-toast";

export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { equipment, fetchEquipment } = useEquipmentStore();
  const [equipmentDetail, setEquipmentDetail] = useState<Equipment | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [events, setEvents] = useState<DowntimeEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<EquipmentStatus>("running");
  const [statusReason, setStatusReason] = useState("");

  const equipmentId = params.id as string;

  const isTechnician = user?.role === "technician";
  const isSupervisor = user?.role === "supervisor";
  const isAdmin = user?.role === "admin";
  const canEditStatus = isTechnician || isSupervisor || isAdmin;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch equipment details
        const eqResponse = await apiClient.get(`/equipment/${equipmentId}`);
        setEquipmentDetail(eqResponse.data);

        // Fetch modules
        const modResponse = await apiClient.get(`/equipment/${equipmentId}/modules`);
        setModules(modResponse.data);

        // Fetch downtime events
        const eventsResponse = await apiClient.get(`/downtime-events?equipmentId=${equipmentId}`);
        setEvents(eventsResponse.data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load equipment details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [equipmentId, toast]);

  const handleStatusChange = async () => {
    try {
      await apiClient.patch(`/equipment/${equipmentId}/status`, {
        status: newStatus,
        reason: statusReason,
      });
      await fetchEquipment();
      setStatusDialogOpen(false);
      setStatusReason("");
      toast({
        title: "Status Updated",
        description: `Equipment status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="h-8 w-48 animate-pulse bg-gray-200 rounded" />
          <div className="h-48 animate-pulse bg-gray-200 rounded-lg" />
          <div className="h-96 animate-pulse bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!equipmentDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Equipment Not Found</h1>
          <p className="text-gray-500 mb-4">The equipment you're looking for doesn't exist.</p>
          <Link href="/equipment">
            <Button>Back to Equipment List</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/equipment">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{equipmentDetail.name}</h1>
                <p className="text-sm text-gray-500">{equipmentDetail.equipmentId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={equipmentDetail.status} size="lg" />
              {canEditStatus && (
                <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Change Status
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Equipment Status</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>New Status</Label>
                        <Select value={newStatus} onValueChange={(v) => setNewStatus(v as EquipmentStatus)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="running">Running</SelectItem>
                            <SelectItem value="degraded">Degraded</SelectItem>
                            <SelectItem value="down">Down</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="offline">Offline</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Reason (optional)</Label>
                        <Textarea
                          value={statusReason}
                          onChange={(e) => setStatusReason(e.target.value)}
                          placeholder="Why is the status changing?"
                        />
                      </div>
                      <Button onClick={handleStatusChange} className="w-full">
                        Update Status
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Equipment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Equipment ID</Label>
                    <p className="font-medium">{equipmentDetail.equipmentId}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Current Status</Label>
                    <p>
                      <StatusBadge status={equipmentDetail.status} />
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Manufacturer</Label>
                    <p className="font-medium">{equipmentDetail.manufacturer || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Model</Label>
                    <p className="font-medium">{equipmentDetail.model || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Serial Number</Label>
                    <p className="font-medium">{equipmentDetail.serialNumber || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Purchase Date</Label>
                    <p className="font-medium">
                      {equipmentDetail.purchaseDate
                        ? new Date(equipmentDetail.purchaseDate).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                </div>
                {equipmentDetail.description && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-gray-500">Description</Label>
                      <p className="mt-1">{equipmentDetail.description}</p>
                    </div>
                  </>
                )}
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-gray-500">Created</Label>
                    <p>{new Date(equipmentDetail.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Last Updated</Label>
                    <p>{new Date(equipmentDetail.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{modules.length}</p>
                  <p className="text-sm text-gray-500">Modules</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">
                    {events.filter((e) => e.status !== "resolved").length}
                  </p>
                  <p className="text-sm text-gray-500">Active Issues</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{events.length}</p>
                  <p className="text-sm text-gray-500">Total Events</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules">
            <Card>
              <CardHeader>
                <CardTitle>Modules & Components</CardTitle>
              </CardHeader>
              <CardContent>
                {modules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Wrench className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>No modules configured for this equipment</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {modules.map((module) => (
                      <div key={module.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">{module.name}</p>
                            <p className="text-sm text-gray-500">{module.moduleId}</p>
                          </div>
                          <StatusBadge status={module.status} size="sm" />
                        </div>
                        {module.description && (
                          <p className="text-sm text-gray-500 mt-2">{module.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Status History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <History className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>Status history will be displayed here</p>
                  <p className="text-sm mt-1">Tracked automatically via database triggers</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Downtime Events</CardTitle>
                <Link href="/downtime-events">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>No downtime events recorded</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {events.map((event) => (
                        <Link key={event.id} href={`/downtime-events/${event.id}`}>
                          <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{event.issueType}</p>
                                <p className="text-sm text-gray-500">
                                  Reported {new Date(event.reportedAt).toLocaleString()}
                                </p>
                                {event.description && (
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {event.description}
                                  </p>
                                )}
                              </div>
                              <StatusBadge status={event.status} type="event" size="sm" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
