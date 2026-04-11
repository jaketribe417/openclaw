import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole } from "@edt/shared";
import { apiClient } from "@/lib/api-client";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  hasRole: (roles: UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post("/auth/login", {
            email,
            password,
          });
          const { user, token } = response.data;

          localStorage.setItem("auth-token", token);
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || "Login failed",
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem("auth-token");
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      clearError: () => set({ error: null }),

      hasRole: (roles: UserRole[]) => {
        const user = get().user;
        if (!user) return false;
        return roles.includes(user.role);
      },

      hasPermission: (permission: string) => {
        const user = get().user;
        if (!user) return false;
        // Admin has all permissions
        if (user.role === "admin") return true;
        // TODO: Implement permission checking based on user.permissions
        return true;
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);