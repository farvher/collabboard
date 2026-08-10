import { describe, it, expect, vi, beforeEach } from "vitest";
import { useOrgStore, type OrgInfo, type OrgMemberInfo } from "@/stores/org-store";
import { act } from "@testing-library/react";

// Mock the API module
vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  ApiClientError: class ApiClientError extends Error {
    status: number;
    data: unknown;
    constructor(status: number, data: unknown, message?: string) {
      super(message || "API Error");
      this.status = status;
      this.data = data;
    }
  },
}));

import { api } from "@/lib/api";

const mockApi = vi.mocked(api);

const mockOrg: OrgInfo = {
  id: "org-1",
  name: "Test Org",
  slug: "test-org",
  currentUserRole: "ADMIN",
  createdAt: "2025-01-01T00:00:00",
  updatedAt: "2025-01-01T00:00:00",
};

const mockOrg2: OrgInfo = {
  id: "org-2",
  name: "Second Org",
  slug: "second-org",
  currentUserRole: "MEMBER",
  createdAt: "2025-02-01T00:00:00",
  updatedAt: "2025-02-01T00:00:00",
};

const mockMember: OrgMemberInfo = {
  userId: "user-1",
  email: "member@test.com",
  displayName: "Member",
  role: "MEMBER",
  joinedAt: "2025-01-01T00:00:00",
};

describe("org-store", () => {
  beforeEach(() => {
    useOrgStore.setState({
      organizations: [],
      currentOrg: null,
      members: [],
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should start with empty orgs and no current org", () => {
      const state = useOrgStore.getState();
      expect(state.organizations).toEqual([]);
      expect(state.currentOrg).toBeNull();
      expect(state.members).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe("fetchOrgs", () => {
    it("should fetch and set organizations", async () => {
      mockApi.get.mockResolvedValue([mockOrg, mockOrg2]);

      await act(async () => {
        await useOrgStore.getState().fetchOrgs();
      });

      const state = useOrgStore.getState();
      expect(state.organizations).toEqual([mockOrg, mockOrg2]);
      expect(state.currentOrg).toEqual(mockOrg); // first org as default
      expect(state.isLoading).toBe(false);
      expect(mockApi.get).toHaveBeenCalledWith("/api/orgs");
    });

    it("should preserve current org if already set", async () => {
      useOrgStore.setState({ currentOrg: mockOrg2 });
      mockApi.get.mockResolvedValue([mockOrg, mockOrg2]);

      await act(async () => {
        await useOrgStore.getState().fetchOrgs();
      });

      expect(useOrgStore.getState().currentOrg).toEqual(mockOrg2);
    });

    it("should handle fetch error", async () => {
      mockApi.get.mockRejectedValue(new Error("Network error"));

      await act(async () => {
        await useOrgStore.getState().fetchOrgs();
      });

      const state = useOrgStore.getState();
      expect(state.organizations).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe("An unexpected error occurred");
    });
  });

  describe("setCurrentOrg", () => {
    it("should set current org and persist to localStorage", () => {
      useOrgStore.getState().setCurrentOrg(mockOrg);

      expect(useOrgStore.getState().currentOrg).toEqual(mockOrg);
      expect(localStorage.getItem("currentOrgId")).toBe("org-1");
    });
  });

  describe("createOrg", () => {
    it("should create org and add to list", async () => {
      mockApi.post.mockResolvedValue(mockOrg);

      let result: OrgInfo;
      await act(async () => {
        result = await useOrgStore.getState().createOrg("Test Org");
      });

      expect(result!).toEqual(mockOrg);
      expect(useOrgStore.getState().organizations).toContainEqual(mockOrg);
      expect(useOrgStore.getState().currentOrg).toEqual(mockOrg);
      expect(mockApi.post).toHaveBeenCalledWith("/api/orgs", { name: "Test Org" });
    });

    it("should handle create error", async () => {
      mockApi.post.mockRejectedValue(new Error("Failed"));

      await expect(
        useOrgStore.getState().createOrg("Bad Org")
      ).rejects.toThrow();

      expect(useOrgStore.getState().error).toBe("An unexpected error occurred");
    });
  });

  describe("updateOrg", () => {
    it("should update org in list and current", async () => {
      useOrgStore.setState({ organizations: [mockOrg], currentOrg: mockOrg });
      const updated = { ...mockOrg, name: "Updated Org" };
      mockApi.put.mockResolvedValue(updated);

      await act(async () => {
        await useOrgStore.getState().updateOrg("org-1", "Updated Org");
      });

      expect(useOrgStore.getState().organizations[0].name).toBe("Updated Org");
      expect(useOrgStore.getState().currentOrg?.name).toBe("Updated Org");
      expect(mockApi.put).toHaveBeenCalledWith("/api/orgs/org-1", { name: "Updated Org" });
    });
  });

  describe("deleteOrg", () => {
    it("should remove org from list", async () => {
      useOrgStore.setState({ organizations: [mockOrg, mockOrg2], currentOrg: mockOrg2 });
      mockApi.delete.mockResolvedValue(undefined);

      await act(async () => {
        await useOrgStore.getState().deleteOrg("org-1");
      });

      const state = useOrgStore.getState();
      expect(state.organizations).toHaveLength(1);
      expect(state.organizations[0].id).toBe("org-2");
      expect(state.currentOrg).toEqual(mockOrg2); // unchanged
    });

    it("should switch current org when deleted org is current", async () => {
      useOrgStore.setState({ organizations: [mockOrg, mockOrg2], currentOrg: mockOrg });
      mockApi.delete.mockResolvedValue(undefined);

      await act(async () => {
        await useOrgStore.getState().deleteOrg("org-1");
      });

      expect(useOrgStore.getState().currentOrg).toEqual(mockOrg2);
    });

    it("should set currentOrg to null when last org deleted", async () => {
      useOrgStore.setState({ organizations: [mockOrg], currentOrg: mockOrg });
      mockApi.delete.mockResolvedValue(undefined);

      await act(async () => {
        await useOrgStore.getState().deleteOrg("org-1");
      });

      expect(useOrgStore.getState().currentOrg).toBeNull();
    });
  });

  describe("fetchMembers", () => {
    it("should fetch members for an org", async () => {
      mockApi.get.mockResolvedValue([mockMember]);

      await act(async () => {
        await useOrgStore.getState().fetchMembers("org-1");
      });

      expect(useOrgStore.getState().members).toEqual([mockMember]);
      expect(mockApi.get).toHaveBeenCalledWith("/api/orgs/org-1/members");
    });
  });

  describe("addMember", () => {
    it("should add member to list", async () => {
      mockApi.post.mockResolvedValue(mockMember);

      await act(async () => {
        await useOrgStore.getState().addMember("org-1", "member@test.com", "MEMBER");
      });

      expect(useOrgStore.getState().members).toContainEqual(mockMember);
      expect(mockApi.post).toHaveBeenCalledWith("/api/orgs/org-1/members", {
        email: "member@test.com",
        role: "MEMBER",
      });
    });
  });

  describe("updateMemberRole", () => {
    it("should update member role in list", async () => {
      const updatedMember = { ...mockMember, role: "ADMIN" as const };
      useOrgStore.setState({ members: [mockMember] });
      mockApi.put.mockResolvedValue(updatedMember);

      await act(async () => {
        await useOrgStore.getState().updateMemberRole("org-1", "user-1", "ADMIN");
      });

      expect(useOrgStore.getState().members[0].role).toBe("ADMIN");
    });
  });

  describe("removeMember", () => {
    it("should remove member from list", async () => {
      useOrgStore.setState({ members: [mockMember] });
      mockApi.delete.mockResolvedValue(undefined);

      await act(async () => {
        await useOrgStore.getState().removeMember("org-1", "user-1");
      });

      expect(useOrgStore.getState().members).toHaveLength(0);
      expect(mockApi.delete).toHaveBeenCalledWith("/api/orgs/org-1/members/user-1");
    });
  });

  describe("clearError", () => {
    it("should clear error state", () => {
      useOrgStore.setState({ error: "Some error" });

      useOrgStore.getState().clearError();

      expect(useOrgStore.getState().error).toBeNull();
    });
  });
});
