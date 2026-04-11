"use client";

import { useEffect, useState } from "react";
import { useEquipmentStore } from "@/stores/equipment-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface HierarchySelectorProps {
  className?: string;
  onChange?: (hierarchy: {
    buildingId?: string;
    floorId?: string;
    zoneId?: string;
  }) => void;
}

export function HierarchySelector({
  className,
  onChange,
}: HierarchySelectorProps) {
  const {
    buildings,
    floors,
    zones,
    selectedHierarchy,
    fetchBuildings,
    fetchFloors,
    fetchZones,
    setSelectedHierarchy,
  } = useEquipmentStore();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await fetchBuildings();
      setIsLoading(false);
    };
    loadData();
  }, [fetchBuildings]);

  useEffect(() => {
    if (selectedHierarchy.buildingId) {
      fetchFloors(selectedHierarchy.buildingId);
    }
  }, [selectedHierarchy.buildingId, fetchFloors]);

  useEffect(() => {
    if (selectedHierarchy.floorId) {
      fetchZones(selectedHierarchy.floorId);
    }
  }, [selectedHierarchy.floorId, fetchZones]);

  const handleBuildingChange = (value: string) => {
    const newHierarchy = {
      buildingId: value,
      floorId: undefined,
      zoneId: undefined,
    };
    setSelectedHierarchy(newHierarchy);
    onChange?.(newHierarchy);
  };

  const handleFloorChange = (value: string) => {
    const newHierarchy = {
      ...selectedHierarchy,
      floorId: value,
      zoneId: undefined,
    };
    setSelectedHierarchy(newHierarchy);
    onChange?.(newHierarchy);
  };

  const handleZoneChange = (value: string) => {
    const newHierarchy = {
      ...selectedHierarchy,
      zoneId: value,
    };
    setSelectedHierarchy(newHierarchy);
    onChange?.(newHierarchy);
  };

  if (isLoading) {
    return (
      <div className={cn("flex gap-2", className)}>
        <div className="h-10 w-40 animate-pulse rounded-md bg-gray-200" />
        <div className="h-10 w-40 animate-pulse rounded-md bg-gray-200" />
        <div className="h-10 w-40 animate-pulse rounded-md bg-gray-200" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Select
        value={selectedHierarchy.buildingId}
        onValueChange={handleBuildingChange}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select Building" />
        </SelectTrigger>
        <SelectContent>
          {buildings.map((building) => (
            <SelectItem key={building.id} value={building.id}>
              {building.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={selectedHierarchy.floorId}
        onValueChange={handleFloorChange}
        disabled={!selectedHierarchy.buildingId}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select Floor" />
        </SelectTrigger>
        <SelectContent>
          {floors.map((floor) => (
            <SelectItem key={floor.id} value={floor.id}>
              {floor.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={selectedHierarchy.zoneId}
        onValueChange={handleZoneChange}
        disabled={!selectedHierarchy.floorId}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select Zone" />
        </SelectTrigger>
        <SelectContent>
          {zones.map((zone) => (
            <SelectItem key={zone.id} value={zone.id}>
              {zone.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}