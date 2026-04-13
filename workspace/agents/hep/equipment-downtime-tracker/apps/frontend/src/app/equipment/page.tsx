"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuthStore } from "@/stores/auth-store";
import { useEquipmentStore } from "@/stores/equipment-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EquipmentStatusBadge } from "@/components/status-badge";
import { HierarchySelector } from "@/components/hierarchy-selector";
import { 
  Search,
  Settings,
  Plus,
  ArrowRight,
  Filter,
  X,
  Grid3X3,
  List
} from "lucide-react";
import Link from "next/link";
import { Equipment, EquipmentStatus } from "@edt/shared";
import { equipmentStatusConfig } from "@/lib/status-config";

export default function EquipmentPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { 
    equipment, 
    isLoading, 
    fetchEquipment,
    selectedHierarchy 
  } = useEquipmentStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchEquipment();
  }, [isAuthenticated, router, fetchEquipment]);

  // Filter equipment based on search, status, and hierarchy
  const filteredEquipment = useMemo(() => {
    return equipment.filter((item) => {
      // Search filter
      const matchesSearch = 
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.equipmentId.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = 
        statusFilter === "all" || 
        item.status === statusFilter;

      // Hierarchy filter
      const matchesHierarchy = true; // Simplified - would need zone/floor/building data

      return matchesSearch && matchesStatus && matchesHierarchy;
    });
  }, [equipment, searchQuery, statusFilter]);

  // Get status counts
  const statusCounts = useMemo(() => {
    return {
      all: equipment.length,
      running: equipment.filter((e) => e.status === "running").length,
      degraded: equipment.filter((e) => e.status === "degraded").length,
      down: equipment.filter((e) => e.status === "down").length,
    };
  }, [equipment]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
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
            <h1 className="text-3xl font-bold tracking-tight">Equipment</h1>
            <p className="text-muted-foreground">
              Manage and monitor all equipment across your organization
            </p>
          </div>
          <Button asChild>
            <Link href="/report-issue">
              <Plus className="mr-2 h-4 w-4" />
              Report Issue
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search equipment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Hierarchy Selector */}
              <HierarchySelector className="lg:w-auto" />

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 border rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Clear Filters */}
              {(searchQuery || statusFilter !== "all") && (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <Tabs
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as EquipmentStatus | "all")}
              className="mt-4"
            >
              <TabsList className="flex-wrap">
                <TabsTrigger value="all">
                  All
                  <Badge variant="secondary" className="ml-2">{statusCounts.all}</Badge>
                </TabsTrigger>
                <TabsTrigger value="running">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Running
                    <Badge variant="secondary" className="ml-1">{statusCounts.running}</Badge>
                  </span>
                </TabsTrigger>
                <TabsTrigger value="degraded">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-500" />
                    Degraded
                    <Badge variant="secondary" className="ml-1">{statusCounts.degraded}</Badge>
                  </span>
                </TabsTrigger>
                <TabsTrigger value="down">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Down
                    <Badge variant="secondary" className="ml-1">{statusCounts.down}</Badge>
                  </span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Equipment Grid/List */}
        <div>
          {isLoading ? (
            viewMode === "grid" ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            )
          ) : filteredEquipment.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Filter className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">No Equipment Found</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your filters to see more results"
                    : "No equipment has been added to the system yet"}
                </p>
                {(searchQuery || statusFilter !== "all") && (
                  <Button variant="outline" onClick={clearFilters} className="mt-4">
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredEquipment.map((item) => (
                <EquipmentCard key={item.id} equipment={item} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredEquipment.map((item) => (
                    <EquipmentListItem key={item.id} equipment={item} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results count */}
        {!isLoading && filteredEquipment.length > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Showing {filteredEquipment.length} of {equipment.length} equipment
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}

interface EquipmentCardProps {
  equipment: Equipment;
}

function EquipmentCard({ equipment }: EquipmentCardProps) {
  const config = equipmentStatusConfig[equipment.status];

  return (
    <Link href={`/equipment/${equipment.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
              <Settings className="h-6 w-6 text-gray-600" />
            </div>
            <EquipmentStatusBadge status={equipment.status} />
          </div>

          <div className="mt-4">
            <h3 className="font-semibold text-lg">{equipment.name}</h3>
            <p className="text-sm text-muted-foreground">
              ID: {equipment.equipmentId}
            </p>
          </div>

          <div className="mt-4 flex items-center text-sm text-muted-foreground">
            <span className="capitalize">{equipment.type}</span>
            <span className="mx-2">•</span>
            <span>Updated {getRelativeTime(new Date(equipment.updatedAt))}</span>
          </div>

          <div className="mt-4 pt-4 border-t flex justify-end">
            <Button variant="ghost" size="sm">
              View Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface EquipmentListItemProps {
  equipment: Equipment;
}

function EquipmentListItem({ equipment }: EquipmentListItemProps) {
  return (
    <Link href={`/equipment/${equipment.id}`}>
      <div className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors cursor-pointer">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <Settings className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <p className="font-medium">{equipment.name}</p>
            <p className="text-sm text-muted-foreground">
              {equipment.equipmentId} • {equipment.type}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <EquipmentStatusBadge status={equipment.status} size="sm" />
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </Link>
  );
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return "just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}
