import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CanvasToolbar from "@/components/toolbar/CanvasToolbar";

// Mock the canvas store
const mockSetSelectedTool = vi.fn();
const mockDeleteSelected = vi.fn();
let mockSelectedTool = "select";

vi.mock("@/stores/canvas-store", () => ({
  useCanvasStore: (selector?: (s: unknown) => unknown) => {
    const state = {
      selectedTool: mockSelectedTool,
      setSelectedTool: mockSetSelectedTool,
      deleteSelected: mockDeleteSelected,
    };
    if (selector) return selector(state);
    return state;
  },
}));

describe("CanvasToolbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectedTool = "select";
  });

  it("should render all tool buttons", () => {
    render(<CanvasToolbar />);

    expect(screen.getByTitle("Select")).toBeInTheDocument();
    expect(screen.getByTitle("Rectangle")).toBeInTheDocument();
    expect(screen.getByTitle("Circle")).toBeInTheDocument();
    expect(screen.getByTitle("Diamond")).toBeInTheDocument();
    expect(screen.getByTitle("Text Box")).toBeInTheDocument();
    expect(screen.getByTitle("Sticky Note")).toBeInTheDocument();
    expect(screen.getByTitle("Free Text")).toBeInTheDocument();
    expect(screen.getByTitle("Frame")).toBeInTheDocument();
    expect(screen.getByTitle("Image")).toBeInTheDocument();
    expect(screen.getByTitle("Icon")).toBeInTheDocument();
    expect(screen.getByTitle("Connect")).toBeInTheDocument();
  });

  it("should render delete button", () => {
    render(<CanvasToolbar />);
    expect(screen.getByTitle("Delete selected (Del)")).toBeInTheDocument();
  });

  it("should call setSelectedTool when a tool is clicked", async () => {
    const user = userEvent.setup();
    render(<CanvasToolbar />);

    await user.click(screen.getByTitle("Rectangle"));
    expect(mockSetSelectedTool).toHaveBeenCalledWith("rectangle");
  });

  it("should call setSelectedTool with circle", async () => {
    const user = userEvent.setup();
    render(<CanvasToolbar />);

    await user.click(screen.getByTitle("Circle"));
    expect(mockSetSelectedTool).toHaveBeenCalledWith("circle");
  });

  it("should call setSelectedTool with diamond", async () => {
    const user = userEvent.setup();
    render(<CanvasToolbar />);

    await user.click(screen.getByTitle("Diamond"));
    expect(mockSetSelectedTool).toHaveBeenCalledWith("diamond");
  });

  it("should call setSelectedTool with stickyNote", async () => {
    const user = userEvent.setup();
    render(<CanvasToolbar />);

    await user.click(screen.getByTitle("Sticky Note"));
    expect(mockSetSelectedTool).toHaveBeenCalledWith("stickyNote");
  });

  it("should call setSelectedTool with connection", async () => {
    const user = userEvent.setup();
    render(<CanvasToolbar />);

    await user.click(screen.getByTitle("Connect"));
    expect(mockSetSelectedTool).toHaveBeenCalledWith("connection");
  });

  it("should call deleteSelected when delete button clicked", async () => {
    const user = userEvent.setup();
    render(<CanvasToolbar />);

    await user.click(screen.getByTitle("Delete selected (Del)"));
    expect(mockDeleteSelected).toHaveBeenCalledOnce();
  });

  it("should highlight the active tool", () => {
    mockSelectedTool = "rectangle";
    render(<CanvasToolbar />);

    const rectButton = screen.getByTitle("Rectangle");
    expect(rectButton.className).toContain("bg-blue-100");
    expect(rectButton.className).toContain("text-blue-700");
  });

  it("should not highlight inactive tools", () => {
    mockSelectedTool = "rectangle";
    render(<CanvasToolbar />);

    const selectButton = screen.getByTitle("Select");
    expect(selectButton.className).toContain("text-gray-600");
    expect(selectButton.className).not.toContain("bg-blue-100");
  });

  it("should highlight select tool by default", () => {
    mockSelectedTool = "select";
    render(<CanvasToolbar />);

    const selectButton = screen.getByTitle("Select");
    expect(selectButton.className).toContain("bg-blue-100");
  });

  it("should render SVG icons for each tool", () => {
    render(<CanvasToolbar />);

    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button.querySelector("svg")).toBeTruthy();
    });
  });
});
