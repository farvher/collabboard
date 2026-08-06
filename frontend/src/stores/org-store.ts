import { create } from "zustand";
import { api, ApiClientError } from "@/lib/api";

export interface OrgInfo {
  id: string;
  name: string;
  slug: string;
  currentUserRole: "ADMIN" | "MEMBER" | "GUEST";
  createdAt: string;
  updatedAt: string;
}

export interface OrgMemberInfo {
  userId: string;
  email: string;
  displayName: string | null;
  role: "ADMIN" | "MEMBER" | "GUEST";
  joinedAt: string;
}

interface OrgState {
  organizations: OrgInfo[];
  currentOrg: OrgInfo | null;
  members: OrgMemberInfo[];
  isLoading: boolean;
  error: string | null;

  fetchOrgs: () => Promise<void>;
  setCurrentOrg: (org: OrgInfo) => void;
  createOrg: (name: string) => Promise<OrgInfo>;
  updateOrg: (id: string, name: string) => Promise<void>;
  deleteOrg: (id: string) => Promise<void>;
  fetchMembers: (orgId: string) => Promise<void>;
  addMember: (orgId: string, email: string, role: string) => Promise<void>;
  updateMemberRole: (orgId: string, userId: string, role: string) => Promise<void>;
  removeMember: (orgId: string, userId: string) => Promise<void>;
  clearError: () => void;
}

export const useOrgStore = create<OrgState>((set, get) => ({
  organizations: [],
  currentOrg: null,
  members: [],
  isLoading: false,
  error: null,

  fetchOrgs: async () => {
    set({ isLoading: true, error: null });
    try {
      const orgs = await api.get<OrgInfo[]>("/api/orgs");
      const currentOrg = get().currentOrg;
      set({
        organizations: orgs,
        isLoading: false,
        currentOrg: currentOrg || orgs[0] || null,
      });
    } catch (err) {
      set({ isLoading: false, error: extractError(err) });
    }
  },

  setCurrentOrg: (org) => {
    set({ currentOrg: org });
    if (typeof window !== "undefined") {
      localStorage.setItem("currentOrgId", org.id);
    }
  },

  createOrg: async (name) => {
    set({ isLoading: true, error: null });
    try {
      const org = await api.post<OrgInfo>("/api/orgs", { name });
      set((state) => ({
        organizations: [...state.organizations, org],
        currentOrg: org,
        isLoading: false,
      }));
      return org;
    } catch (err) {
      set({ isLoading: false, error: extractError(err) });
      throw err;
    }
  },

  updateOrg: async (id, name) => {
    set({ isLoading: true, error: null });
    try {
      const org = await api.put<OrgInfo>(`/api/orgs/${id}`, { name });
      set((state) => ({
        organizations: state.organizations.map((o) => (o.id === id ? org : o)),
        currentOrg: state.currentOrg?.id === id ? org : state.currentOrg,
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: extractError(err) });
      throw err;
    }
  },

  deleteOrg: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/api/orgs/${id}`);
      set((state) => {
        const remaining = state.organizations.filter((o) => o.id !== id);
        return {
          organizations: remaining,
          currentOrg: state.currentOrg?.id === id ? remaining[0] || null : state.currentOrg,
          isLoading: false,
        };
      });
    } catch (err) {
      set({ isLoading: false, error: extractError(err) });
      throw err;
    }
  },

  fetchMembers: async (orgId) => {
    set({ isLoading: true, error: null });
    try {
      const members = await api.get<OrgMemberInfo[]>(`/api/orgs/${orgId}/members`);
      set({ members, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: extractError(err) });
    }
  },

  addMember: async (orgId, email, role) => {
    set({ isLoading: true, error: null });
    try {
      const member = await api.post<OrgMemberInfo>(`/api/orgs/${orgId}/members`, { email, role });
      set((state) => ({
        members: [...state.members, member],
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: extractError(err) });
      throw err;
    }
  },

  updateMemberRole: async (orgId, userId, role) => {
    set({ isLoading: true, error: null });
    try {
      const member = await api.put<OrgMemberInfo>(`/api/orgs/${orgId}/members/${userId}`, { role });
      set((state) => ({
        members: state.members.map((m) => (m.userId === userId ? member : m)),
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: extractError(err) });
      throw err;
    }
  },

  removeMember: async (orgId, userId) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/api/orgs/${orgId}/members/${userId}`);
      set((state) => ({
        members: state.members.filter((m) => m.userId !== userId),
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
