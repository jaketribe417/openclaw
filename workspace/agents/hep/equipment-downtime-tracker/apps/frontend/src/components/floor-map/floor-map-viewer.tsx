"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Equipment, EquipmentStatus } from "@edt/shared";
import { equipmentStatusConfig } from "@/lib/status-config";
import { cn } from "@/lib/utils";
import {
  ZoomIn,
  ZoomOut,
  Move,
  Maximize2,
  Settings,
  AlertCircle,
  X,
  ChevronRight,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface FloorMapViewerProps {
  floorMapUrl: string;
  equipment: Equipment[];
  isAdmin?: boolean;
  onEquipmentMove?: (equipmentId: string, x: number, y: number) => void;
  onEquipmentClick?: (equipment: Equipment) => void;
  className?: string;
}

interface ViewState {
  scale: number;
  panX: number;
  panY: number;
}

export function FloorMapViewer({
  floorMapUrl,
  equipment,
  isAdmin = false,
  onEquipmentMove,
  onEquipmentClick,
  className,
}: FloorMapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [viewState, setViewState] = useState<ViewState>({
    scale: 1,
    panX: 0,
    panY: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  // Calculate relative position for equipment
  const getRelativePosition = (x: number | null, y: number | null) => {
    if (x === null || y === null) return null;
    return {
      x: (Number(x) / 100) * imageDimensions.width * viewState.scale + viewState.panX,
      y: (Number(y) / 100) * imageDimensions.height * viewState.scale + viewState.panY,
    };
  };

  // Zoom controls
  const handleZoomIn = () => {
    setViewState((prev) => ({
      ...prev,
      scale: Math.min(prev.scale * 1.2, 4),
    }));
  };

  const handleZoomOut = () => {
    setViewState((prev) => ({
      ...prev,
      scale: Math.max(prev.scale / 1.2, 0.5),
    }));
  };

  const handleReset = () => {
    setViewState({
      scale: 1,
      panX: 0,
      panY: 0,
    });
  };

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || e.target === imageRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - viewState.panX, y: e.clientY - viewState.panY });
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        setViewState((prev) => ({
          ...prev,
          panX: e.clientX - dragStart.x,
          panY: e.clientY - dragStart.y,
        }));
      }
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle equipment marker drag (admin mode)
  const handleEquipmentDrag = (equipmentId: string, newX: number, newY: number) => {
    if (!isAdmin || !onEquipmentMove || !imageDimensions.width || !imageDimensions.height) return;

    const relativeX = ((newX - viewState.panX) / (imageDimensions.width * viewState.scale)) * 100;
    const relativeY = ((newY - viewState.panY) / (imageDimensions.height * viewState.scale)) * 100;

    onEquipmentMove(equipmentId, Math.max(0, Math.min(100, relativeX)), Math.max(0, Math.min(100, relativeY)));
  };

  const handleEquipmentClick = (equipment: Equipment) => {
    if (!isAdmin) {
      setSelectedEquipment(equipment);
      onEquipmentClick?.(equipment);
    }
  };

  return (
    <TooltipProvider>
      <div
        ref={containerRef}
        className={cn(
          "relative w-full h-full overflow-hidden bg-muted/50 rounded-lg border cursor-grab active:cursor-grabbing",
          className
        )}
        onMouseDown={handleMouseDown}
      >
        {/* Floor Map Image */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            x: viewState.panX,
            y: viewState.panY,
            scale: viewState.scale,
          }}
          transition={{ type: "tween", duration: 0 }}
        >
          <img
            ref={imageRef}
            src={floorMapUrl}
            alt="Floor Map"
            className="max-w-none select-none"
            draggable={false}
            onLoad={(e) => {
              const img = e.target as HTMLImageElement;
              setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
              setImageLoaded(true);
            }}
          />

          {/* Equipment Markers */}
          {imageLoaded &&
            equipment.map((item) => {
              const position = getRelativePosition(item.floorMapX, item.floorMapY);
              if (!position) return null;

              return (
                <EquipmentMarker
                  key={item.id}
                  equipment={item}
                  x={position.x}
                  y={position.y}
                  isDraggable={isAdmin}
                  onDrag={handleEquipmentDrag}
                  onClick={() => handleEquipmentClick(item)}
                  scale={1 / viewState.scale}
                />
              );
            })}
        </motion.div>

        {/* Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomIn}
            className="shadow-lg"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomOut}
            className="shadow-lg"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleReset}
            className="shadow-lg"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Legend */}
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg border shadow-lg">
          <h4 className="font-medium text-sm mb-2">Status Legend</h4>
          <div className="space-y-1.5">
            {Object.entries(equipmentStatusConfig).map(([status, config]) => (
              <div key={status} className="flex items-center gap-2 text-xs">
                <span className={cn("w-2 h-2 rounded-full", config.bgColor)} />
                <span className="capitalize">{status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mini-map */}
        {imageLoaded && (
          <MiniMap
            imageDimensions={imageDimensions}
            viewState={viewState}
            equipment={equipment}
            onNavigate={(x, y) => {
              const container = containerRef.current;
              if (!container) return;
              const centerX = container.clientWidth / 2;
              const centerY = container.clientHeight / 2;
              setViewState((prev) => ({
                ...prev,
                panX: centerX - x * prev.scale,
                panY: centerY - y * prev.scale,
              }));
            }}
          />
        )}

        {/* Equipment Details Dialog */}
        <Dialog open={!!selectedEquipment} onOpenChange={() => setSelectedEquipment(null)}>
          <DialogContent className="max-w-lg">
            {selectedEquipment && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {selectedEquipment.name}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">ID</span>
                    <span className="font-mono">{selectedEquipment.equipmentId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <Badge variant="outline" className="capitalize">
                      {selectedEquipment.type}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge
                      className={cn(
                        equipmentStatusConfig[selectedEquipment.status].bgColor,
                        equipmentStatusConfig[selectedEquipment.status].textColor
                      )}
                    >
                      {selectedEquipment.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button asChild className="flex-1">
                      <Link href={`/equipment/${selectedEquipment.id}`}>
                        View Details
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    {selectedEquipment.status !== "running" && (
                      <Button variant="outline" asChild className="flex-1">
                        <Link href="/downtime-events">
                          <Activity className="mr-2 h-4 w-4" />
                          View Events
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

// Equipment Marker Component
interface EquipmentMarkerProps {
  equipment: Equipment;
  x: number;
  y: number;
  isDraggable: boolean;
  onDrag: (id: string, x: number, y: number) => void;
  onClick: () => void;
  scale: number;
}

function EquipmentMarker({
  equipment,
  x,
  y,
  isDraggable,
  onDrag,
  onClick,
  scale,
}: EquipmentMarkerProps) {
  const config = equipmentStatusConfig[equipment.status];
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x, y });

  useEffect(() => {
    if (!isDragging) {
      setPosition({ x, y });
    }
  }, [x, y, isDragging]);

  const handleDragEnd = (_: any, info: { point: { x: number; y: number } }) => {
    setIsDragging(false);
    onDrag(equipment.id, info.point.x, info.point.y);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          className={cn(
            "absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer",
            isDraggable && "cursor-move"
          )}
          style={{
            left: position.x,
            top: position.y,
          }}
          drag={isDraggable}
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          onClick={onClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2",
              config.bgColor,
              config.borderColor,
              isDragging && "ring-2 ring-primary ring-offset-2"
            )}
            style={{ transform: `scale(${scale})` }}
          >
            <Settings className={cn("w-4 h-4", config.textColor)} />
          </div>
          {equipment.status === "down" && (
            <div className="absolute -top-1 -right-1">
              <AlertCircle className="w-4 h-4 text-red-500 fill-red-500" />
            </div>
          )}
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="text-sm">
          <p className="font-medium">{equipment.name}</p>
          <p className="text-xs text-muted-foreground">{equipment.equipmentId}</p>
          <p className={cn("text-xs capitalize mt-1", config.textColor)}>
            {equipment.status}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// Mini-map Component
interface MiniMapProps {
  imageDimensions: { width: number; height: number };
  viewState: ViewState;
  equipment: Equipment[];
  onNavigate: (x: number, y: number) => void;
}

function MiniMap({ imageDimensions, viewState, equipment, onNavigate }: MiniMapProps) {
  const aspectRatio = imageDimensions.width / imageDimensions.height;
  const miniMapWidth = 150;
  const miniMapHeight = miniMapWidth / aspectRatio;

  const viewportWidth = miniMapWidth / viewState.scale;
  const viewportHeight = miniMapHeight / viewState.scale;
  const viewportX = (-viewState.panX / (imageDimensions.width * viewState.scale)) * miniMapWidth;
  const viewportY = (-viewState.panY / (imageDimensions.height * viewState.scale)) * miniMapHeight;

  return (
    <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg border shadow-lg p-2">
      <div
        className="relative bg-muted rounded overflow-hidden cursor-pointer"
        style={{ width: miniMapWidth, height: miniMapHeight }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / miniMapWidth) * imageDimensions.width;
          const y = ((e.clientY - rect.top) / miniMapHeight) * imageDimensions.height;
          onNavigate(x, y);
        }}
      >
        {/* Viewport indicator */}
        <div
          className="absolute border-2 border-primary bg-primary/10 pointer-events-none"
          style={{
            width: Math.min(viewportWidth, miniMapWidth),
            height: Math.min(viewportHeight, miniMapHeight),
            left: Math.max(0, viewportX),
            top: Math.max(0, viewportY),
          }}
        />

        {/* Equipment dots */}
        {equipment.map((item) => {
          if (item.floorMapX === null || item.floorMapY === null) return null;
          const x = (Number(item.floorMapX) / 100) * miniMapWidth;
          const y = (Number(item.floorMapY) / 100) * miniMapHeight;
          return (
            <div
              key={item.id}
              className={cn(
                "absolute w-1.5 h-1.5 rounded-full transform -translate-x-1/2 -translate-y-1/2",
                equipmentStatusConfig[item.status].bgColor
              )}
              style={{ left: x, top: y }}
            />
          );
        })}
      </div>
    </div>
  );
}
