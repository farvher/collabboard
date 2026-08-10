import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";

describe("Button", () => {
  it("should render with children text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("should call onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);

    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should be disabled when isLoading is true", () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should show spinner when isLoading", () => {
    render(<Button isLoading>Loading</Button>);
    const button = screen.getByRole("button");
    expect(button.querySelector("svg.animate-spin")).toBeTruthy();
  });

  it("should not show spinner when not loading", () => {
    render(<Button>Normal</Button>);
    const button = screen.getByRole("button");
    expect(button.querySelector("svg.animate-spin")).toBeNull();
  });

  it("should apply primary variant styles by default", () => {
    render(<Button>Primary</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-blue-600");
  });

  it("should apply secondary variant styles", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-gray-100");
  });

  it("should apply danger variant styles", () => {
    render(<Button variant="danger">Danger</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-red-600");
  });

  it("should apply ghost variant styles", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("hover:bg-gray-100");
  });

  it("should apply small size", () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("px-3");
    expect(button.className).toContain("py-1.5");
  });

  it("should apply large size", () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("px-6");
    expect(button.className).toContain("py-3");
  });

  it("should forward additional className", () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("custom-class");
  });

  it("should not call onClick when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>No Click</Button>);

    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("Input", () => {
  it("should render an input element", () => {
    render(<Input id="test" />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should render with label", () => {
    render(<Input id="email" label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("should associate label with input via id", () => {
    render(<Input id="name" label="Name" />);
    const input = screen.getByLabelText("Name");
    expect(input).toHaveAttribute("id", "name");
  });

  it("should display error message", () => {
    render(<Input id="pw" error="Password is required" />);
    expect(screen.getByText("Password is required")).toBeInTheDocument();
  });

  it("should apply error styling when error exists", () => {
    render(<Input id="pw" error="Error" />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("border-red-500");
  });

  it("should handle value changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input id="test" onChange={onChange} />);

    await user.type(screen.getByRole("textbox"), "hello");
    expect(onChange).toHaveBeenCalled();
  });

  it("should pass placeholder", () => {
    render(<Input id="test" placeholder="Enter value" />);
    expect(screen.getByPlaceholderText("Enter value")).toBeInTheDocument();
  });

  it("should render without label", () => {
    render(<Input id="test" />);
    expect(screen.queryByRole("label")).toBeNull();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should forward type attribute", () => {
    render(<Input id="pw" type="password" label="Pass" />);
    // password inputs don't have textbox role
    const input = document.getElementById("pw");
    expect(input).toHaveAttribute("type", "password");
  });
});

describe("Card", () => {
  it("should render children", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("should apply card styling", () => {
    render(<Card>Content</Card>);
    const card = screen.getByText("Content").closest("div");
    expect(card?.className).toContain("rounded-xl");
    expect(card?.className).toContain("border");
    expect(card?.className).toContain("shadow-sm");
  });

  it("should render CardHeader", () => {
    render(
      <Card>
        <CardHeader>Header</CardHeader>
      </Card>
    );
    expect(screen.getByText("Header")).toBeInTheDocument();
  });

  it("should render CardContent", () => {
    render(
      <Card>
        <CardContent>Body</CardContent>
      </Card>
    );
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    render(<Card className="extra">Test</Card>);
    const card = screen.getByText("Test").closest("div");
    expect(card?.className).toContain("extra");
  });
});

describe("Avatar", () => {
  it("should show initials when no src provided", () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("should show single initial for single name", () => {
    render(<Avatar name="Alice" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("should show ? when no name or src", () => {
    render(<Avatar />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("should render image when src provided", () => {
    render(<Avatar src="https://example.com/photo.jpg" name="Test" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/photo.jpg");
    expect(img).toHaveAttribute("alt", "Test");
  });

  it("should apply small size", () => {
    render(<Avatar name="A B" size="sm" />);
    const el = screen.getByText("AB");
    expect(el.className).toContain("h-8");
    expect(el.className).toContain("w-8");
  });

  it("should apply large size", () => {
    render(<Avatar name="X Y" size="lg" />);
    const el = screen.getByText("XY");
    expect(el.className).toContain("h-12");
    expect(el.className).toContain("w-12");
  });

  it("should limit initials to 2 characters", () => {
    render(<Avatar name="First Middle Last" />);
    expect(screen.getByText("FM")).toBeInTheDocument();
  });
});
