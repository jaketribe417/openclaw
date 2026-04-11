import { create } from "zustand";
import type {
  Equipment,
  EquipmentStatus,
  DowntimeEvent,
  Building,
  Floor,
  Zone,
} from "@edt/shared";
import { apiClient } from "@/lib/api-client";

interface EquipmentState {
  equipment: Equipment[];
  buildings: Building[];
  floors: Floor[];
  zones: Zone[];
  downtimeEvents: DowntimeEvent[];
  selectedEquipment: Equipment | null;
  selectedHierarchy: {
    buildingId?: string;
    floorId?: string;
    zoneId?: string;
  };
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchEquipment: () => Promise<void>;
  fetchBuildings: () => Promise<void>;
  fetchFloors: (buildingId: string) => Promise<void>;
  fetchZones: (floorId: string) => Promise<void>;
  fetchDowntimeEvents: () => Promise<void>;
  setSelectedEquipment: (equipment: Equipment | null) => void;
  setSelectedHierarchy: (hierarchy: {
    buildingId?: string;
    floorId?: string;
    zoneId?: string;
  }) => void;
  updateEquipmentStatus: (
    equipmentId: string,
    status: EquipmentStatus,
    reason?: string
  ) => Promise<void>;
  reportIssue: (data: {
    equipmentId: string;
    reportedBy: string;
    issueType: string;
    priority?: string;
    description?: string;
  }) => Promise<void>;
  clearError: () => void;
}

export const useEquipmentStore = create<EquipmentState>()((set, get) => ({
  equipment: [],
  buildings: [],
  floors: [],
  zones: [],
  downtimeEvents: [],
  selectedEquipment: null,
  selectedHierarchy: {},
  isLoading: false,
  error: null,

  fetchEquipment: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get("/equipment");
      set({ equipment: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to fetch equipment",
        isLoading: false,
      });
    }
  },

  fetchBuildings: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get("/buildings");
      set({ buildings: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to fetch buildings",
        isLoading: false,
      });
    }
  },

  fetchFloors: async (buildingId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/buildings/${buildingId}/floors`);
      set({ floors: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to fetch floors",
        isLoading: false,
      });
    }
  },

  fetchZones: async (floorId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/floors/${floorId}/zones`);
      set({ zones: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to fetch zones",
        isLoading: false,
      });
    }
  },

  fetchDowntimeEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get("/downtime-events");
      set({ downtimeEvents: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to fetch events",
        isLoading: false,
      });
    }
  },

  setSelectedEquipment: (equipment) => set({ selectedEquipment: equipment }),

  setSelectedHierarchy: (hierarchy) => set({ selectedHierarchy: hierarchy }),

  updateEquipmentStatus: async (equipmentId, status, reason) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.patch(`/equipment/${equipmentId}/status`, {
        status,
        reason,
      });
      // Refresh equipment list
      await get().fetchEquipment();
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to update status",
        isLoading: false,
      });
    }
  },

  reportIssue: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post("/downtime-events", data);
      await get().fetchDowntimeEvents();
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to report issue",
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));