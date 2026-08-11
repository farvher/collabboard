"use client";

import { type ReactNode } from "react";
import { CommentBadge } from "./CommentBadge";
import { useCommentStore } from "@/stores/comment-store";

interface NodeWrapperProps {
  nodeId: string;
  children: ReactNode;
}

/**
 * Wraps a custom node to add comment badge and right-click context menu.
 * Usage: wrap your node's content with <NodeWrapper nodeId={id}>...</NodeWrapper>
 */
export function NodeWrapper({ nodeId, children }: NodeWrapperProps) {
  const { openPanel } = useCommentStore();

  function handleContextMenu(e: React.MouseEvent) {
    // Allow opening comment panel via right-click → could be extended with a context menu
    // For now, double-click opens comments
  }

  function handleDoubleClick(e: React.MouseEvent) {
    if (e.altKey) {
      e.stopPropagation();
      openPanel(nodeId);
    }
  }

  return (
    <div className="relative" onContextMenu={handleContextMenu} onDoubleClick={handleDoubleClick}>
      <CommentBadge nodeId={nodeId} />
      {children}
    </div>
  );
}
