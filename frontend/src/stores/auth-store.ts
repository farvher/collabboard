import { create } from "zustand";
import type { UserInfo, AuthResponse } from "@/types";
import {
  authLogin,
  authRegister,
  authLogout,
  getAccessToken,
  ApiClientError,
} from "@/lib/api";

interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data: AuthResponse = await authLogin(email, password);
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.data?.message || err.message
          : "An unexpected error occurred";
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  register: async (email, password, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const data: AuthResponse = await authRegister(
        email,
        password,
        displayName
      );
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.data?.message || err.message
          : "An unexpected error occurred";
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  logout: () => {
    authLogout();
    set({ user: null, isAuthenticated: false, error: null });
  },

  hydrate: () => {
    const token = getAccessToken();
    if (token) {
      // Decode JWT payload to get user info
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        if (!isExpired) {
          set({
            user: {
              id: payload.sub,
              email: payload.email,
              displayName: null,
              avatarUrl: null,
            },
            isAuthenticated: true,
          });
        } else {
          authLogout();
          set({ user: null, isAuthenticated: false });
        }
      } catch {
        authLogout();
        set({ user: null, isAuthenticated: false });
      }
    }
  },

  clearError: () => set({ error: null }),
}));
