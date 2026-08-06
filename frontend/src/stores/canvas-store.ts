import { create } from "zustand";
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type Connection,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";

export type CanvasTool =
  | "select"
  | "rectangle"
  | "circle"
  | "diamond"
  | "text"
  | "stickyNote"
  | "freeText"
  | "frame"
  | "image"
  | "icon"
  | "connection";

interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  selectedTool: CanvasTool;
  selectedNodes: string[];

  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setSelectedTool: (tool: CanvasTool) => void;
  addNode: (node: Node) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  deleteSelected: () => void;
  setSelectedNodes: (ids: string[]) => void;
  loadCanvas: (nodes: Node[], edges: Edge[]) => void;
  clearCanvas: () => void;
}

let edgeIdCounter = 0;
function generateEdgeId() {
  return `edge-${Date.now()}-${edgeIdCounter++}`;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedTool: "select",
  selectedNodes: [],

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection: Connection) => {
    const newEdge: Edge = {
      ...connection,
      id: generateEdgeId(),
      type: "default",
    };
    set({ edges: addEdge(newEdge, get().edges) });
  },

  setSelectedTool: (tool) => set({ selectedTool: tool }),

  addNode: (node) => {
    set((state) => ({ nodes: [...state.nodes, node] }));
  },

  updateNodeData: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    }));
  },

  deleteSelected: () => {
    set((state) => {
      const selectedNodeIds = state.nodes
        .filter((n) => n.selected)
        .map((n) => n.id);
      const selectedEdgeIds = state.edges
        .filter((e) => e.selected)
        .map((e) => e.id);

      return {
        nodes: state.nodes.filter((n) => !n.selected),
        edges: state.edges.filter(
          (e) =>
            !selectedEdgeIds.includes(e.id) &&
            !selectedNodeIds.includes(e.source) &&
            !selectedNodeIds.includes(e.target)
        ),
      };
    });
  },

  setSelectedNodes: (ids) => set({ selectedNodes: ids }),

  loadCanvas: (nodes, edges) => set({ nodes, edges }),

  clearCanvas: () => set({ nodes: [], edges: [] }),
}));
