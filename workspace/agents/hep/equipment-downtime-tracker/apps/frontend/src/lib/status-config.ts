import type { EquipmentStatus, DowntimeEventStatus } from "@edt/shared";

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon?: string;
}

export const equipmentStatusConfig: Record<EquipmentStatus, StatusConfig> = {
  running: {
    label: "Running",
    color: "text-green-700",
    bgColor: "bg-green-100",
    borderColor: "border-green-500",
    icon: "●",
  },
  degraded: {
    label: "Degraded",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    borderColor: "border-yellow-500",
    icon: "◐",
  },
  down: {
    label: "Down",
    color: "text-red-700",
    bgColor: "bg-red-100",
    borderColor: "border-red-500",
    icon: "○",
  },
  maintenance: {
    label: "Maintenance",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-500",
    icon: "🔧",
  },
  offline: {
    label: "Offline",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-500",
    icon: "◌",
  },
};

export const eventStatusConfig: Record<DowntimeEventStatus, StatusConfig> = {
  reported: {
    label: "Reported",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-500",
  },
  acknowledged: {
    label: "Acknowledged",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-500",
  },
  in_repair: {
    label: "In Repair",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-500",
  },
  resolved: {
    label: "Resolved",
    color: "text-green-700",
    bgColor: "bg-green-100",
    borderColor: "border-green-500",
  },
  escalated: {
    label: "Escalated",
    color: "text-red-700",
    bgColor: "bg-red-100",
    borderColor: "border-red-500",
  },
};

export function getEquipmentStatusColor(status: EquipmentStatus): string {
  switch (status) {
    case "running":
      return "#22c55e";
    case "degraded":
      return "#eab308";
    case "down":
      return "#ef4444";
    case "maintenance":
      return "#3b82f6";
    case "offline":
      return "#6b7280";
    default:
      return "#6b7280";
  }
}