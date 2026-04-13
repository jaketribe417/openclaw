"use client";

import { useEffect, useState } from "react";
import { useEquipmentStore } from "@/stores/equipment-store";
import { StatusBadge } from "@/components/status-badge";
import { HierarchySelector } from "@/components/hierarchy-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Grid3X3, List, AlertCircle } from "lucide-react";
import Link from "next/link";
import { EquipmentStatus } from "@edt/shared";
import { cn } from "@/lib/utils";

export default function EquipmentPage() {
  const { equipment, zones, fetchEquipment, fetchZones, isLoading } = useEquipmentStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | "all">("all");

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  // Filter equipment
  const filteredEquipment = equipment.filter((eq) => {
    const matchesSearch =
      eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.equipmentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || eq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getZoneName = (zoneId?: string) => {
    if (!zoneId) return null;
    const zone = zones.find((z) => z.id === zoneId);
    return zone?.name;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Equipment</h1>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search equipment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <HierarchySelector className="flex-shrink-0" />
            </div>

            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
              {(["all", "running", "degraded", "down", "maintenance", "offline"] as const).map(
                (status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      "capitalize",
                      status === "all" && statusFilter === status && "bg-gray-600"
                    )}
                  >
                    {status === "all" ? "All Status" : status}
                    {status !== "all" && (
                      <Badge variant="secondary" className="ml-2">
                        {equipment.filter((e) => e.status === status).length}
                      </Badge>
                    )}
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div
            className={cn(
              "grid gap-4",
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            )}
          >
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse bg-gray-200 rounded-lg" />
            ))}
          </div>
        ) : filteredEquipment.length === 0 ? (
          <div className="text-center py-16">
            <Filter className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No equipment found</h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "No equipment has been added yet"}
            </p>
          </div>
        ) : (
          <div
            className={cn(
              "grid gap-4",
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            )}
          >
            {filteredEquipment.map((eq) => (
              <Link key={eq.id} href={`/equipment/${eq.id}`}>
                <Card
                  className={cn(
                    "hover:shadow-md transition-shadow cursor-pointer group",
                    viewMode === "list" && "flex flex-row items-center"
                  )}
                >
                  <CardContent
                    className={cn(
                      "p-4",
                      viewMode === "list" && "flex flex-1 items-center gap-4"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-start gap-3",
                        viewMode === "list" && "flex-1 items-center"
                      )}
                    >
                      <div
                        className={cn(
                          "flex-shrink-0",
                          viewMode === "grid" && "mb-2"
                        )}
                      >
                        <StatusBadge
                          status={eq.status}
                          size={viewMode === "list" ? "sm" : "md"}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                          {eq.name}
                        </h3>
                        <p className="text-sm text-gray-500">{eq.equipmentId}</p>
                        {eq.description && viewMode === "grid" && (
                          <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                            {eq.description}
                          </p>
                        )}
                        {getZoneName(eq.zoneId) && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {getZoneName(eq.zoneId)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
