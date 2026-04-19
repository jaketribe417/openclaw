"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FloorMapViewer } from "@/components/floor-map";
import { useAuthStore } from "@/stores/auth-store";
import { useEquipmentStore } from "@/stores/equipment-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, MapPin, Settings, Edit } from "lucide-react";
import Link from "next/link";
import { Building, Floor, Zone } from "@edt/shared";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface FloorMapData {
  id: string;
  imageUrl: string;
  width: number;
  height: number;
}

export default function MapPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { equipment, isLoading: equipmentLoading, fetchEquipment, fetchBuildings, fetchFloors, fetchZones, buildings, floors, zones } = useEquipmentStore();

  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [floorMap, setFloorMap] = useState<FloorMapData | null>(null);
  const [isLoadingFloorMap, setIsLoadingFloorMap] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchEquipment();
    fetchBuildings();
  }, [isAuthenticated, router, fetchEquipment, fetchBuildings]);

  // Fetch floors when building changes
  useEffect(() => {
    if (selectedBuilding) {
      fetchFloors(selectedBuilding);
      setSelectedFloor(null);
      setFloorMap(null);
    }
  }, [selectedBuilding, fetchFloors]);

  // Fetch floor map when floor changes
  useEffect(() => {
    if (selectedFloor) {
      fetchFloorMap(selectedFloor);
    }
  }, [selectedFloor]);

  const fetchFloorMap = async (floorId: string) => {
    setIsLoadingFloorMap(true);
    try {
      const response = await apiClient.get(`/floors/${floorId}/map`);
      if (response.data) {
        setFloorMap(response.data);
      } else {
        setFloorMap(null);
      }
    } catch (error) {
      // Floor map might not exist
      setFloorMap(null);
    } finally {
      setIsLoadingFloorMap(false);
    }
  };

  // Filter equipment for selected floor
  const floorEquipment = useMemo(() => {
    if (!selectedFloor) return [];
    
    // Get zones for this floor
    const floorZones = zones.filter(z => z.floorId === selectedFloor);
    const zoneIds = new Set(floorZones.map(z => z.id));
    
    return equipment.filter(e => zoneIds.has(e.zoneId) && e.floorMapX !== null && e.floorMapY !== null);
  }, [equipment, zones, selectedFloor]);

  // Get unpositioned equipment
  const unpositionedEquipment = useMemo(() => {
    if (!selectedFloor) return [];
    
    const floorZones = zones.filter(z => z.floorId === selectedFloor);
    const zoneIds = new Set(floorZones.map(z => z.id));
    
    return equipment.filter(e => zoneIds.has(e.zoneId) && (e.floorMapX === null || e.floorMapY === null));
  }, [equipment, zones, selectedFloor]);

  const isAdmin = user?.role === "admin" || user?.role === "supervisor";

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Floor Map</h1>
            <p className="text-muted-foreground">
              Visualize equipment locations and status on facility floor plans
            </p>
          </div>
          {isAdmin && selectedFloor && (
            <Button asChild>
              <Link href={`/map/admin?floor=${selectedFloor}`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Floor Map
              </Link>
            </Button>
          )}
        </div>

        {/* Building/Floor Selectors */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Building</label>
                <Select
                  value={selectedBuilding || ""}
                  onValueChange={setSelectedBuilding}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a building" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((building) => (
                      <SelectItem key={building.id} value={building.id}>
                        {building.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Floor</label>
                <Select
                  value={selectedFloor || ""}
                  onValueChange={setSelectedFloor}
                  disabled={!selectedBuilding || floors.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a floor" />
                  </SelectTrigger>
                  <SelectContent>
                    {floors.map((floor) => (
                      <SelectItem key={floor.id} value={floor.id}>
                        {floor.name} (Floor {floor.floorNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Floor Map Viewer */}
        {selectedFloor ? (
          isLoadingFloorMap ? (
            <Card className="h-[600px]">
              <CardContent className="flex items-center justify-center h-full">
                <div className="space-y-4 w-full max-w-md">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ) : floorMap ? (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="h-[600px]">
                  <FloorMapViewer
                    floorMapUrl={floorMap.imageUrl}
                    equipment={floorEquipment}
                    isAdmin={false}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <MapPin className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No Floor Map</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                  This floor doesn't have a map uploaded yet. Upload a floor plan to visualize equipment locations.
                </p>
                {isAdmin && (
                  <Button asChild>
                    <Link href={`/map/admin?floor=${selectedFloor}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Upload Floor Map
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Settings className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Select a Location</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Choose a building and floor from the dropdowns above to view the floor map
              </p>
            </CardContent>
          </Card>
        )}

        {/* Unpositioned Equipment Warning */}
        {selectedFloor && unpositionedEquipment.length > 0 && (
          <Card className="border-yellow-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <AlertCircle className="h-5 w-5" />
                Unpositioned Equipment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                The following equipment on this floor doesn't have positions set on the map:
              </p>
              <div className="flex flex-wrap gap-2">
                {unpositionedEquipment.map((eq) => (
                  <Badge key={eq.id} variant="secondary">
                    {eq.name}
                  </Badge>
                ))}
              </div>
              {isAdmin && (
                <Button asChild variant="outline" className="mt-4">
                  <Link href={`/map/admin?floor=${selectedFloor}`}>
                    Position Equipment
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
