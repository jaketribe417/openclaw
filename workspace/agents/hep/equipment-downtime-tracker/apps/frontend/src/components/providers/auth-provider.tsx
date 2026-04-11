"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useRealtimeStore } from "@/stores/realtime-store";
import { EventSourcePolyfill } from "event-source-polyfill";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAuthStore();
  const { setConnected, handleEquipmentUpdate, handleDowntimeUpdate } =
    useRealtimeStore();

  // Initialize SSE connection for real-time updates
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const eventSource = new EventSourcePolyfill(`${API_URL}/sse`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "equipment_update") {
          handleEquipmentUpdate(data.payload);
        } else if (data.type === "downtime_event") {
          handleDowntimeUpdate(data.payload);
        }
      } catch (error) {
        console.error("Failed to parse SSE message:", error);
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
    };

    return () => {
      eventSource.close();
      setConnected(false);
    };
  }, [isAuthenticated, token, setConnected, handleEquipmentUpdate, handleDowntimeUpdate]);

  return <>{children}</>;
}