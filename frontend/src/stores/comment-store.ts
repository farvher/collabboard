import { create } from "zustand";
import { api, ApiClientError } from "@/lib/api";

export interface CommentInfo {
  id: string;
  boardId: string;
  nodeId: string;
  userId: string;
  userName: string;
  content: string;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CommentState {
  comments: CommentInfo[];
  commentCounts: Record<string, number>;
  isLoading: boolean;
  error: string | null;
  activeNodeId: string | null;
  panelOpen: boolean;

  fetchComments: (boardId: string, nodeId?: string) => Promise<void>;
  fetchCommentCounts: (boardId: string) => Promise<void>;
  createComment: (boardId: string, nodeId: string, content: string) => Promise<void>;
  updateComment: (commentId: string, content: string) => Promise<void>;
  resolveComment: (commentId: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  openPanel: (nodeId: string) => void;
  closePanel: () => void;
  clearError: () => void;
}

export const useCommentStore = create<CommentState>((set, get) => ({
  comments: [],
  commentCounts: {},
  isLoading: false,
  error: null,
  activeNodeId: null,
  panelOpen: false,

  fetchComments: async (boardId, nodeId) => {
    set({ isLoading: true, error: null });
    try {
      const params = nodeId ? `?nodeId=${nodeId}` : "";
      const comments = await api.get<CommentInfo[]>(`/api/boards/${boardId}/comments${params}`);
      set({ comments, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: extractError(err) });
    }
  },

  fetchCommentCounts: async (boardId) => {
    try {
      const counts = await api.get<Record<string, number>>(`/api/boards/${boardId}/comments/counts`);
      set({ commentCounts: counts });
    } catch {
      // silent fail for counts
    }
  },

  createComment: async (boardId, nodeId, content) => {
    set({ isLoading: true, error: null });
    try {
      const comment = await api.post<CommentInfo>(`/api/boards/${boardId}/comments`, { nodeId, content });
      set((state) => ({
        comments: [...state.comments, comment],
        commentCounts: {
          ...state.commentCounts,
          [nodeId]: (state.commentCounts[nodeId] || 0) + 1,
        },
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: extractError(err) });
      throw err;
    }
  },

  updateComment: async (commentId, content) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await api.put<CommentInfo>(`/api/comments/${commentId}`, { content });
      set((state) => ({
        comments: state.comments.map((c) => (c.id === commentId ? updated : c)),
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: extractError(err) });
      throw err;
    }
  },

  resolveComment: async (commentId) => {
    try {
      const updated = await api.put<CommentInfo>(`/api/comments/${commentId}/resolve`);
      set((state) => {
        const oldComment = state.comments.find((c) => c.id === commentId);
        const nodeId = oldComment?.nodeId;
        const countDelta = updated.resolved ? -1 : 1;
        return {
          comments: state.comments.map((c) => (c.id === commentId ? updated : c)),
          commentCounts: nodeId
            ? { ...state.commentCounts, [nodeId]: Math.max(0, (state.commentCounts[nodeId] || 0) + countDelta) }
            : state.commentCounts,
        };
      });
    } catch (err) {
      set({ error: extractError(err) });
    }
  },

  deleteComment: async (commentId) => {
    const comment = get().comments.find((c) => c.id === commentId);
    try {
      await api.delete(`/api/comments/${commentId}`);
      set((state) => {
        const nodeId = comment?.nodeId;
        const wasUnresolved = comment && !comment.resolved;
        return {
          comments: state.comments.filter((c) => c.id !== commentId),
          commentCounts: nodeId && wasUnresolved
            ? { ...state.commentCounts, [nodeId]: Math.max(0, (state.commentCounts[nodeId] || 0) - 1) }
            : state.commentCounts,
        };
      });
    } catch (err) {
      set({ error: extractError(err) });
    }
  },

  openPanel: (nodeId) => set({ activeNodeId: nodeId, panelOpen: true }),
  closePanel: () => set({ panelOpen: false, activeNodeId: null }),
  clearError: () => set({ error: null }),
}));

function extractError(err: unknown): string {
  if (err instanceof ApiClientError) {
    return err.data?.message || err.message;
  }
  return "An unexpected error occurred";
}
