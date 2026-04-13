"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useEquipmentStore } from "@/stores/equipment-store";
import { useRealtimeStore } from "@/stores/realtime-store";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock, Activity, AlertTriangle, Wrench, Plus } from "lucide-react";
import Link from "next/link";
import { EquipmentStatus } from "@edt/shared";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { equipment, downtimeEvents, fetchEquipment, fetchDowntimeEvents, isLoading } = useEquipmentStore();
  const { isConnected } = useRealtimeStore();

  useEffect(() => {
    fetchEquipment();
    fetchDowntimeEvents();
  }, [fetchEquipment, fetchDowntimeEvents]);

  // Calculate statistics
  const stats = {
    running: equipment.filter((e) => e.status === "running").length,
    degraded: equipment.filter((e) => e.status === "degraded").length,
    down: equipment.filter((e) => e.status === "down").length,
    maintenance: equipment.filter((e) => e.status === "maintenance").length,
  };

  // Active downtime events (not resolved)
  const activeEvents = downtimeEvents.filter(
    (e) => e.status !== "resolved" && e.status !== "escalated"
  );

  // Recently down equipment
  const downEquipment = equipment.filter((e) => e.status === "down" || e.status === "degraded");

  const isOperator = user?.role === "operator";
  const isTechnician = user?.role === "technician";
  const isSupervisor = user?.role === "supervisor";
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500">
                Welcome back, {user?.firstName} • {isConnected ? "● Live" : "○ Offline"}
              </p>
            </div>
            <div className="flex gap-2">
              {(isOperator || isTechnician || isSupervisor || isAdmin) && (
                <Link href="/report-issue">
                  <Button className="gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Report Issue
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Running</p>
                  <p className="text-2xl font-bold text-green-600">{stats.running}</p>
                </div>
                <Activity className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Degraded</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.degraded}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Down</p>
                  <p className="text-2xl font-bold text-red-600">{stats.down}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Maintenance</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.maintenance}</p>
                </div>
                <Wrench className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Equipment Status Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Equipment Status</CardTitle>
            <Link href="/equipment">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 animate-pulse bg-gray-100 rounded" />
                ))}
              </div>
            ) : downEquipment.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>All equipment is running normally</p>
              </div>
            ) : (
              <div className="space-y-2">
                {downEquipment.slice(0, 5).map((equipment) => (
                  <Link
                    key={equipment.id}
                    href={`/equipment/${equipment.id}`}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <StatusBadge status={equipment.status as EquipmentStatus} size="sm" />
                      <div>
                        <p className="font-medium">{equipment.name}</p>
                        <p className="text-sm text-gray-500">{equipment.equipmentId}</p>
                      </div>
                    </div>
                    <Clock className="h-4 w-4 text-gray-400" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Downtime Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Issues</CardTitle>
            <Link href="/downtime-events">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 animate-pulse bg-gray-100 rounded" />
                ))}
              </div>
            ) : activeEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="flex justify-center mb-2">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p>No active issues</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeEvents.slice(0, 5).map((event) => {
                  const eq = equipment.find((e) => e.id === event.equipmentId);
                  return (
                    <Link
                      key={event.id}
                      href={`/downtime-events/${event.id}`}
                      className="block p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{eq?.name || "Unknown Equipment"}</p>
                          <p className="text-sm text-gray-500">{event.issueType}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Reported {new Date(event.reportedAt).toLocaleString()}
                          </p>
                        </div>
                        <StatusBadge status={event.status} type="event" size="sm" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        {(isTechnician || isSupervisor || isAdmin) && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Link href="/equipment">
                  <Button variant="outline">Manage Equipment</Button>
                </Link>
                <Link href="/downtime-events">
                  <Button variant="outline">View Events</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
