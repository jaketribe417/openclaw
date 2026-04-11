"use client";

import { cn } from "@/lib/utils";
import {
  equipmentStatusConfig,
  eventStatusConfig,
} from "@/lib/status-config";
import type { EquipmentStatus, DowntimeEventStatus } from "@edt/shared";

interface StatusBadgeProps {
  status: EquipmentStatus | DowntimeEventStatus;
  type?: "equipment" | "event";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  type = "equipment",
  size = "md",
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const config =
    type === "equipment"
      ? equipmentStatusConfig[status as EquipmentStatus]
      : eventStatusConfig[status as DowntimeEventStatus];

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        config.bgColor,
        config.color,
        config.borderColor,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && config.icon && (
        <span className="text-xs">{config.icon}</span>
      )}
      {config.label}
    </span>
  );
}

// Convenience exports for specific types
export function EquipmentStatusBadge({
  status,
  ...props
}: Omit<StatusBadgeProps, "type"> & { status: EquipmentStatus }) {
  return <StatusBadge status={status} type="equipment" {...props} />;
}

export function EventStatusBadge({
  status,
  ...props
}: Omit<StatusBadgeProps, "type"> & { status: DowntimeEventStatus }) {
  return <StatusBadge status={status} type="event" {...props} />;
}