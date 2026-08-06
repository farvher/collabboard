"use client";

import { useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useCanvasStore } from "@/stores/canvas-store";
import { nodeTypes } from "@/components/nodes";
import { edgeTypes } from "@/components/edges";
import CanvasToolbar from "@/components/toolbar/CanvasToolbar";
import PropertiesPanel from "@/components/panels/PropertiesPanel";

let nodeIdCounter = 0;
function generateNodeId() {
  return `node-${Date.now()}-${nodeIdCounter++}`;
}

const DEFAULT_NODE_DATA: Record<string, Record<string, unknown>> = {
  rectangle: { label: "", color: "#ffffff" },
  circle: { label: "", color: "#ffffff" },
  diamond: { label: "", color: "#ffffff" },
  text: { label: "" },
  stickyNote: { label: "", color: "#fef08a" },
  freeText: { label: "", fontSize: 16, fontWeight: "normal", color: "#1f2937" },
  frame: { label: "Frame", width: 400, height: 300 },
  image: { label: "Image", src: "", boardId: "" },
  icon: { icon: "star", color: "#3b82f6", size: 40 },
};

export default function BoardCanvas({ boardId }: { boardId?: string }) {
  const {
    nodes,
    edges,
    selectedTool,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedTool,
    deleteSelected,
  } = useCanvasStore();

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (selectedTool === "select" || selectedTool === "connection") return;

      const reactFlowBounds = (event.target as HTMLElement)
        .closest(".react-flow")
        ?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNode: Node = {
        id: generateNodeId(),
        type: selectedTool,
        position,
        data: { ...DEFAULT_NODE_DATA[selectedTool], ...(selectedTool === "image" ? { boardId } : {}) },
      };

      addNode(newNode);
      setSelectedTool("select");
    },
    [selectedTool, addNode, setSelectedTool]
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Delete" || event.key === "Backspace") {
        const target = event.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        deleteSelected();
      }
    },
    [deleteSelected]
  );

  return (
    <div className="relative w-full h-full" onKeyDown={onKeyDown} tabIndex={0}>
      <CanvasToolbar />
      <PropertiesPanel />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        deleteKeyCode={null}
        defaultEdgeOptions={{
          type: "default",
          animated: false,
        }}
        className="bg-gray-50"
      >
        <Background gap={20} size={1} color="#e5e7eb" />
        <Controls position="bottom-right" />
        <MiniMap
          position="bottom-left"
          style={{ marginLeft: "60px" }}
          nodeColor="#93c5fd"
          maskColor="rgba(0,0,0,0.1)"
        />
      </ReactFlow>
    </div>
  );
}
