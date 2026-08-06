import { create } from "zustand";
import { api, ApiClientError } from "@/lib/api";

export interface BoardInfo {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  createdByName: string | null;
  currentUserRole: "OWNER" | "EDITOR" | "VIEWER" | null;
  createdAt: string;
  updatedAt: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface BoardState {
  boards: BoardInfo[];
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  error: string | null;

  fetchBoards: (orgId: string, search?: string, page?: number) => Promise<void>;
  createBoard: (orgId: string, name: string, description?: string, templateId?: string) => Promise<BoardInfo>;
  updateBoard: (id: string, name: string, description?: string) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  boards: [],
  totalPages: 0,
  currentPage: 0,
  isLoading: false,
  error: null,

  fetchBoards: async (orgId, search, page = 0) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams({ page: String(page), size: "20" });
      if (search) params.set("search", search);
      const data = await api.get<PageResponse<BoardInfo>>(
        `/api/orgs/${orgId}/boards?${params}`
      );
      set({
        boards: data.content,
        totalPages: data.totalPages,
        currentPage: data.number,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false, error: extractError(err) });
    }
  },

  createBoard: async (orgId, name, description, templateId) => {
    set({ isLoading: true, error: null });
    try {
      const board = await api.post<BoardInfo>(`/api/orgs/${orgId}/boards`, {
        name,
        description,
        templateId,
      });
      set((state) => ({
        boards: [board, ...state.boards],
        isLoading: false,
      }));
      return board;
    } catch (err) {
      set({ isLoading: false, error: extractError(err) });
      throw err;
    }
  },

  updateBoard: async (id, name, description) => {
    set({ isLoading: true, error: null });
    try {
      const board = await api.put<BoardInfo>(`/api/boards/${id}`, {
        name,
        description,
      });
      set((state) => ({
        boards: state.boards.map((b) => (b.id === id ? board : b)),
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: extractError(err) });
      throw err;
    }
  },

  deleteBoard: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/api/boards/${id}`);
      set((state) => ({
        boards: state.boards.filter((b) => b.id !== id),
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: extractError(err) });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));

function extractError(err: unknown): string {
  if (err instanceof ApiClientError) {
    return err.data?.message || err.message;
  }
  return "An unexpected error occurred";
}
