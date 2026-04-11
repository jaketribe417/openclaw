import { create } from "zustand";
import type { Equipment, DowntimeEvent } from "@edt/shared";

interface RealtimeState {
  isConnected: boolean;
  lastEvent: {
    type: string;
    data: any;
    timestamp: Date;
  } | null;
  equipmentUpdates: Map<string, Equipment>;
  downtimeUpdates: Map<string, DowntimeEvent>;

  // Actions
  setConnected: (connected: boolean) => void;
  handleEquipmentUpdate: (equipment: Equipment) => void;
  handleDowntimeUpdate: (event: DowntimeEvent) => void;
  clearUpdates: () => void;
}

export const useRealtimeStore = create<RealtimeState>()((set, get) => ({
  isConnected: false,
  lastEvent: null,
  equipmentUpdates: new Map(),
  downtimeUpdates: new Map(),

  setConnected: (connected) => set({ isConnected: connected }),

  handleEquipmentUpdate: (equipment) => {
    set((state) => {
      const updates = new Map(state.equipmentUpdates);
      updates.set(equipment.id, equipment);
      return {
        equipmentUpdates: updates,
        lastEvent: {
          type: "equipment_update",
          data: equipment,
          timestamp: new Date(),
        },
      };
    });
  },

  handleDowntimeUpdate: (event) => {
    set((state) => {
      const updates = new Map(state.downtimeUpdates);
      updates.set(event.id, event);
      return {
        downtimeUpdates: updates,
        lastEvent: {
          type: "downtime_update",
          data: event,
          timestamp: new Date(),
        },
      };
    });
  },

  clearUpdates: () =>
    set({
      equipmentUpdates: new Map(),
      downtimeUpdates: new Map(),
    }),
}));