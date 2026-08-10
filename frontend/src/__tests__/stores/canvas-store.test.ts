import { describe, it, expect, beforeEach } from "vitest";
import { useCanvasStore } from "@/stores/canvas-store";
import type { Node, Edge } from "@xyflow/react";

describe("canvas-store", () => {
  beforeEach(() => {
    useCanvasStore.setState({
      nodes: [],
      edges: [],
      selectedTool: "select",
      selectedNodes: [],
    });
  });

  describe("initial state", () => {
    it("should start with empty canvas and select tool", () => {
      const state = useCanvasStore.getState();
      expect(state.nodes).toEqual([]);
      expect(state.edges).toEqual([]);
      expect(state.selectedTool).toBe("select");
      expect(state.selectedNodes).toEqual([]);
    });
  });

  describe("setSelectedTool", () => {
    it("should change the selected tool", () => {
      useCanvasStore.getState().setSelectedTool("rectangle");
      expect(useCanvasStore.getState().selectedTool).toBe("rectangle");
    });

    it("should change to connection tool", () => {
      useCanvasStore.getState().setSelectedTool("connection");
      expect(useCanvasStore.getState().selectedTool).toBe("connection");
    });

    it("should change back to select", () => {
      useCanvasStore.getState().setSelectedTool("circle");
      useCanvasStore.getState().setSelectedTool("select");
      expect(useCanvasStore.getState().selectedTool).toBe("select");
    });
  });

  describe("addNode", () => {
    it("should add a node to the canvas", () => {
      const node: Node = {
        id: "node-1",
        type: "rectangle",
        position: { x: 100, y: 200 },
        data: { label: "Test" },
      };

      useCanvasStore.getState().addNode(node);

      const state = useCanvasStore.getState();
      expect(state.nodes).toHaveLength(1);
      expect(state.nodes[0]).toEqual(node);
    });

    it("should add multiple nodes", () => {
      const node1: Node = { id: "n1", type: "rectangle", position: { x: 0, y: 0 }, data: {} };
      const node2: Node = { id: "n2", type: "circle", position: { x: 100, y: 100 }, data: {} };

      useCanvasStore.getState().addNode(node1);
      useCanvasStore.getState().addNode(node2);

      expect(useCanvasStore.getState().nodes).toHaveLength(2);
    });

    it("should preserve existing nodes when adding", () => {
      const existing: Node = { id: "existing", type: "text", position: { x: 50, y: 50 }, data: { label: "Hi" } };
      useCanvasStore.setState({ nodes: [existing] });

      const newNode: Node = { id: "new", type: "circle", position: { x: 200, y: 200 }, data: {} };
      useCanvasStore.getState().addNode(newNode);

      const nodes = useCanvasStore.getState().nodes;
      expect(nodes).toHaveLength(2);
      expect(nodes[0]).toEqual(existing);
      expect(nodes[1]).toEqual(newNode);
    });
  });

  describe("updateNodeData", () => {
    it("should update data of a specific node", () => {
      const node: Node = { id: "n1", type: "rectangle", position: { x: 0, y: 0 }, data: { label: "Old", color: "#fff" } };
      useCanvasStore.setState({ nodes: [node] });

      useCanvasStore.getState().updateNodeData("n1", { label: "Updated" });

      const updated = useCanvasStore.getState().nodes[0];
      expect(updated.data.label).toBe("Updated");
      expect(updated.data.color).toBe("#fff"); // preserved
    });

    it("should not affect other nodes", () => {
      const nodes: Node[] = [
        { id: "n1", type: "rectangle", position: { x: 0, y: 0 }, data: { label: "First" } },
        { id: "n2", type: "circle", position: { x: 100, y: 100 }, data: { label: "Second" } },
      ];
      useCanvasStore.setState({ nodes });

      useCanvasStore.getState().updateNodeData("n1", { label: "Changed" });

      expect(useCanvasStore.getState().nodes[1].data.label).toBe("Second");
    });

    it("should merge new data with existing data", () => {
      const node: Node = { id: "n1", type: "stickyNote", position: { x: 0, y: 0 }, data: { label: "Note", color: "#fef08a" } };
      useCanvasStore.setState({ nodes: [node] });

      useCanvasStore.getState().updateNodeData("n1", { color: "#fb7185" });

      const data = useCanvasStore.getState().nodes[0].data;
      expect(data.color).toBe("#fb7185");
      expect(data.label).toBe("Note");
    });
  });

  describe("deleteSelected", () => {
    it("should delete selected nodes", () => {
      const nodes: Node[] = [
        { id: "n1", type: "rectangle", position: { x: 0, y: 0 }, data: {}, selected: true },
        { id: "n2", type: "circle", position: { x: 100, y: 100 }, data: {}, selected: false },
      ];
      useCanvasStore.setState({ nodes, edges: [] });

      useCanvasStore.getState().deleteSelected();

      const remaining = useCanvasStore.getState().nodes;
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe("n2");
    });

    it("should delete selected edges", () => {
      const nodes: Node[] = [
        { id: "n1", type: "rectangle", position: { x: 0, y: 0 }, data: {} },
        { id: "n2", type: "circle", position: { x: 100, y: 100 }, data: {} },
      ];
      const edges: Edge[] = [
        { id: "e1", source: "n1", target: "n2", selected: true },
        { id: "e2", source: "n2", target: "n1", selected: false },
      ];
      useCanvasStore.setState({ nodes, edges });

      useCanvasStore.getState().deleteSelected();

      const remainingEdges = useCanvasStore.getState().edges;
      expect(remainingEdges).toHaveLength(1);
      expect(remainingEdges[0].id).toBe("e2");
    });

    it("should remove edges connected to deleted nodes", () => {
      const nodes: Node[] = [
        { id: "n1", type: "rectangle", position: { x: 0, y: 0 }, data: {}, selected: true },
        { id: "n2", type: "circle", position: { x: 100, y: 100 }, data: {}, selected: false },
        { id: "n3", type: "text", position: { x: 200, y: 200 }, data: {}, selected: false },
      ];
      const edges: Edge[] = [
        { id: "e1", source: "n1", target: "n2" },
        { id: "e2", source: "n2", target: "n3" },
        { id: "e3", source: "n3", target: "n1" },
      ];
      useCanvasStore.setState({ nodes, edges });

      useCanvasStore.getState().deleteSelected();

      const remainingEdges = useCanvasStore.getState().edges;
      // e1 (source n1) and e3 (target n1) should be removed
      expect(remainingEdges).toHaveLength(1);
      expect(remainingEdges[0].id).toBe("e2");
    });

    it("should do nothing when nothing is selected", () => {
      const nodes: Node[] = [
        { id: "n1", type: "rectangle", position: { x: 0, y: 0 }, data: {}, selected: false },
      ];
      useCanvasStore.setState({ nodes, edges: [] });

      useCanvasStore.getState().deleteSelected();

      expect(useCanvasStore.getState().nodes).toHaveLength(1);
    });
  });

  describe("setNodes / setEdges", () => {
    it("should replace all nodes", () => {
      const newNodes: Node[] = [
        { id: "a", type: "rectangle", position: { x: 0, y: 0 }, data: {} },
        { id: "b", type: "circle", position: { x: 50, y: 50 }, data: {} },
      ];

      useCanvasStore.getState().setNodes(newNodes);

      expect(useCanvasStore.getState().nodes).toEqual(newNodes);
    });

    it("should replace all edges", () => {
      const newEdges: Edge[] = [
        { id: "e1", source: "a", target: "b" },
      ];

      useCanvasStore.getState().setEdges(newEdges);

      expect(useCanvasStore.getState().edges).toEqual(newEdges);
    });
  });

  describe("loadCanvas", () => {
    it("should load nodes and edges together", () => {
      const nodes: Node[] = [
        { id: "n1", type: "rectangle", position: { x: 10, y: 20 }, data: { label: "Loaded" } },
      ];
      const edges: Edge[] = [
        { id: "e1", source: "n1", target: "n1" },
      ];

      useCanvasStore.getState().loadCanvas(nodes, edges);

      const state = useCanvasStore.getState();
      expect(state.nodes).toEqual(nodes);
      expect(state.edges).toEqual(edges);
    });

    it("should replace existing canvas content", () => {
      useCanvasStore.setState({
        nodes: [{ id: "old", type: "text", position: { x: 0, y: 0 }, data: {} }],
        edges: [{ id: "old-e", source: "old", target: "old" }],
      });

      useCanvasStore.getState().loadCanvas([], []);

      expect(useCanvasStore.getState().nodes).toEqual([]);
      expect(useCanvasStore.getState().edges).toEqual([]);
    });
  });

  describe("clearCanvas", () => {
    it("should clear all nodes and edges", () => {
      useCanvasStore.setState({
        nodes: [{ id: "n1", type: "rectangle", position: { x: 0, y: 0 }, data: {} }],
        edges: [{ id: "e1", source: "n1", target: "n1" }],
      });

      useCanvasStore.getState().clearCanvas();

      expect(useCanvasStore.getState().nodes).toEqual([]);
      expect(useCanvasStore.getState().edges).toEqual([]);
    });
  });

  describe("setSelectedNodes", () => {
    it("should set selected node IDs", () => {
      useCanvasStore.getState().setSelectedNodes(["n1", "n3"]);

      expect(useCanvasStore.getState().selectedNodes).toEqual(["n1", "n3"]);
    });

    it("should clear selection with empty array", () => {
      useCanvasStore.setState({ selectedNodes: ["n1"] });

      useCanvasStore.getState().setSelectedNodes([]);

      expect(useCanvasStore.getState().selectedNodes).toEqual([]);
    });
  });

  describe("onConnect", () => {
    it("should add an edge when connecting two nodes", () => {
      const nodes: Node[] = [
        { id: "n1", type: "rectangle", position: { x: 0, y: 0 }, data: {} },
        { id: "n2", type: "circle", position: { x: 100, y: 100 }, data: {} },
      ];
      useCanvasStore.setState({ nodes, edges: [] });

      useCanvasStore.getState().onConnect({
        source: "n1",
        target: "n2",
        sourceHandle: null,
        targetHandle: null,
      });

      const edges = useCanvasStore.getState().edges;
      expect(edges).toHaveLength(1);
      expect(edges[0].source).toBe("n1");
      expect(edges[0].target).toBe("n2");
      expect(edges[0].id).toBeTruthy();
    });
  });
});
