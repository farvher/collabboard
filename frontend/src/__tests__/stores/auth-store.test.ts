import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "@/stores/auth-store";
import { act } from "@testing-library/react";

// Mock the API module
vi.mock("@/lib/api", () => ({
  authLogin: vi.fn(),
  authRegister: vi.fn(),
  authLogout: vi.fn(),
  getAccessToken: vi.fn(),
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

import { authLogin, authRegister, authLogout, getAccessToken, ApiClientError } from "@/lib/api";

const mockAuthLogin = vi.mocked(authLogin);
const mockAuthRegister = vi.mocked(authRegister);
const mockAuthLogout = vi.mocked(authLogout);
const mockGetAccessToken = vi.mocked(getAccessToken);

describe("auth-store", () => {
  beforeEach(() => {
    // Reset the store state between tests
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should start with no user and not authenticated", () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe("login", () => {
    it("should login successfully and set user", async () => {
      const mockResponse = {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        user: { id: "1", email: "test@test.com", displayName: "Test", avatarUrl: null },
      };
      mockAuthLogin.mockResolvedValue(mockResponse);

      await act(async () => {
        await useAuthStore.getState().login("test@test.com", "password123");
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockResponse.user);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(mockAuthLogin).toHaveBeenCalledWith("test@test.com", "password123");
    });

    it("should set loading state during login", async () => {
      let resolveLogin: (value: unknown) => void;
      mockAuthLogin.mockImplementation(
        () => new Promise((resolve) => { resolveLogin = resolve; })
      );

      const loginPromise = useAuthStore.getState().login("a@b.com", "pw");
      expect(useAuthStore.getState().isLoading).toBe(true);

      resolveLogin!({
        accessToken: "t", refreshToken: "r",
        user: { id: "1", email: "a@b.com", displayName: null, avatarUrl: null },
      });
      await loginPromise;

      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it("should set error on login failure", async () => {
      const error = new (ApiClientError as unknown as new (s: number, d: unknown, m: string) => Error)(
        401, { message: "Invalid email or password" }, "Invalid email or password"
      );
      mockAuthLogin.mockRejectedValue(error);

      await expect(
        useAuthStore.getState().login("bad@test.com", "wrong")
      ).rejects.toThrow();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe("Invalid email or password");
    });
  });

  describe("register", () => {
    it("should register successfully", async () => {
      const mockResponse = {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        user: { id: "2", email: "new@test.com", displayName: "New User", avatarUrl: null },
      };
      mockAuthRegister.mockResolvedValue(mockResponse);

      await act(async () => {
        await useAuthStore.getState().register("new@test.com", "password123", "New User");
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockResponse.user);
      expect(state.isAuthenticated).toBe(true);
      expect(mockAuthRegister).toHaveBeenCalledWith("new@test.com", "password123", "New User");
    });

    it("should set error on register failure (duplicate email)", async () => {
      const error = new (ApiClientError as unknown as new (s: number, d: unknown, m: string) => Error)(
        409, { message: "Email already registered" }, "Email already registered"
      );
      mockAuthRegister.mockRejectedValue(error);

      await expect(
        useAuthStore.getState().register("dup@test.com", "password123")
      ).rejects.toThrow();

      expect(useAuthStore.getState().error).toBe("Email already registered");
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe("logout", () => {
    it("should clear user and authentication state", () => {
      // Set authenticated state first
      useAuthStore.setState({
        user: { id: "1", email: "t@t.com", displayName: "T", avatarUrl: null },
        isAuthenticated: true,
      });

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
      expect(mockAuthLogout).toHaveBeenCalled();
    });
  });

  describe("hydrate", () => {
    it("should hydrate from valid token", () => {
      // Create a mock JWT payload (base64 encoded)
      const payload = {
        sub: "user-123",
        email: "hydrate@test.com",
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };
      const encodedPayload = btoa(JSON.stringify(payload));
      const fakeToken = `header.${encodedPayload}.signature`;

      mockGetAccessToken.mockReturnValue(fakeToken);

      useAuthStore.getState().hydrate();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual({
        id: "user-123",
        email: "hydrate@test.com",
        displayName: null,
        avatarUrl: null,
      });
    });

    it("should not hydrate from expired token", () => {
      const payload = {
        sub: "user-123",
        email: "expired@test.com",
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      };
      const encodedPayload = btoa(JSON.stringify(payload));
      const fakeToken = `header.${encodedPayload}.signature`;

      mockGetAccessToken.mockReturnValue(fakeToken);

      useAuthStore.getState().hydrate();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(mockAuthLogout).toHaveBeenCalled();
    });

    it("should not hydrate when no token exists", () => {
      mockGetAccessToken.mockReturnValue(null);

      useAuthStore.getState().hydrate();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });

    it("should handle malformed token gracefully", () => {
      mockGetAccessToken.mockReturnValue("invalid-token-no-dots");

      useAuthStore.getState().hydrate();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(mockAuthLogout).toHaveBeenCalled();
    });
  });

  describe("clearError", () => {
    it("should clear error state", () => {
      useAuthStore.setState({ error: "Some error" });

      useAuthStore.getState().clearError();

      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
