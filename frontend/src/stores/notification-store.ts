import { create } from "zustand";
import { api } from "@/lib/api";

export type NotificationType =
  | "BOARD_SHARED"
  | "COMMENT_ADDED"
  | "COMMENT_RESOLVED"
  | "MEMBER_ADDED"
  | "BOARD_UPDATED";

export interface NotificationInfo {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId: string | null;
  read: boolean;
  createdAt: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

interface NotificationState {
  notifications: NotificationInfo[];
  unreadCount: number;
  isLoading: boolean;
  dropdownOpen: boolean;

  fetchUnreadCount: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  toggleDropdown: () => void;
  closeDropdown: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  dropdownOpen: false,

  fetchUnreadCount: async () => {
    try {
      const data = await api.get<{ count: number }>("/api/notifications/unread-count");
      set({ unreadCount: data.count });
    } catch {
      // silent
    }
  },

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<PageResponse<NotificationInfo>>("/api/notifications?size=10");
      set({ notifications: data.content, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // silent
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put("/api/notifications/read-all");
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch {
      // silent
    }
  },

  toggleDropdown: () => {
    const isOpening = !get().dropdownOpen;
    set({ dropdownOpen: isOpening });
    if (isOpening) {
      get().fetchNotifications();
    }
  },

  closeDropdown: () => set({ dropdownOpen: false }),
}));
