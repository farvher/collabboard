import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/(auth)/login/page";
import RegisterPage from "@/app/(auth)/register/page";

// Mock the auth store
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockClearError = vi.fn();
let mockStoreState = {
  isLoading: false,
  error: null as string | null,
};

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: (selector?: (s: unknown) => unknown) => {
    const state = {
      login: mockLogin,
      register: mockRegister,
      clearError: mockClearError,
      ...mockStoreState,
    };
    if (selector) return selector(state);
    return state;
  },
}));

// Mock next/navigation (already in setup, but let's make push accessible)
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState = { isLoading: false, error: null };
  });

  it("should render login form", () => {
    render(<LoginPage />);

    expect(screen.getByText("CollabBoard")).toBeInTheDocument();
    expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("should have link to register page", () => {
    render(<LoginPage />);

    const link = screen.getByRole("link", { name: "Sign up" });
    expect(link).toHaveAttribute("href", "/register");
  });

  it("should call login with email and password on submit", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(undefined);
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "user@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(mockLogin).toHaveBeenCalledWith("user@test.com", "password123");
  });

  it("should navigate to /boards on successful login", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(undefined);
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "user@test.com");
    await user.type(screen.getByLabelText("Password"), "pass1234");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("should not navigate on login failure", async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error("Invalid credentials"));
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "bad@test.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it("should display error message from store", () => {
    mockStoreState.error = "Invalid email or password";
    render(<LoginPage />);

    expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
  });

  it("should have dismiss button for error", async () => {
    const user = userEvent.setup();
    mockStoreState.error = "Some error";
    render(<LoginPage />);

    await user.click(screen.getByText("Dismiss"));
    expect(mockClearError).toHaveBeenCalled();
  });

  it("should have required email field", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText("Email")).toBeRequired();
  });

  it("should have required password field", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText("Password")).toBeRequired();
  });
});

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState = { isLoading: false, error: null };
  });

  it("should render register form", () => {
    render(<RegisterPage />);

    expect(screen.getByText("CollabBoard")).toBeInTheDocument();
    expect(screen.getByText("Create your account")).toBeInTheDocument();
    expect(screen.getByLabelText("Display name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument();
  });

  it("should have link to login page", () => {
    render(<RegisterPage />);

    const link = screen.getByRole("link", { name: "Sign in" });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("should call register with all fields", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue(undefined);
    render(<RegisterPage />);

    await user.type(screen.getByLabelText("Display name"), "John Doe");
    await user.type(screen.getByLabelText("Email"), "john@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(mockRegister).toHaveBeenCalledWith("john@test.com", "password123", "John Doe");
  });

  it("should pass undefined displayName when empty", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue(undefined);
    render(<RegisterPage />);

    await user.type(screen.getByLabelText("Email"), "no-name@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(mockRegister).toHaveBeenCalledWith("no-name@test.com", "password123", undefined);
  });

  it("should navigate to /boards on successful register", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue(undefined);
    render(<RegisterPage />);

    await user.type(screen.getByLabelText("Email"), "new@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("should not navigate on register failure", async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValue(new Error("Email exists"));
    render(<RegisterPage />);

    await user.type(screen.getByLabelText("Email"), "dup@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it("should display error message", () => {
    mockStoreState.error = "Email already registered";
    render(<RegisterPage />);

    expect(screen.getByText("Email already registered")).toBeInTheDocument();
  });

  it("should have email as required", () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText("Email")).toBeRequired();
  });

  it("should have password as required with minLength", () => {
    render(<RegisterPage />);
    const pw = screen.getByLabelText("Password");
    expect(pw).toBeRequired();
    expect(pw).toHaveAttribute("minlength", "8");
  });

  it("should not require display name", () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText("Display name")).not.toBeRequired();
  });
});
