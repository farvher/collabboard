"use client";

import { useCommentStore } from "@/stores/comment-store";

interface CommentBadgeProps {
  nodeId: string;
}

/**
 * Small badge showing unresolved comment count on a node.
 * Clicking opens the comment panel for that node.
 */
export function CommentBadge({ nodeId }: CommentBadgeProps) {
  const { commentCounts, openPanel } = useCommentStore();
  const count = commentCounts[nodeId] || 0;

  if (count === 0) return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        openPanel(nodeId);
      }}
      className="absolute -top-2 -right-2 z-10 flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-[var(--color-brand)] text-white text-[10px] font-bold shadow-sm hover:scale-110 transition-transform"
      aria-label={`${count} unresolved comment${count > 1 ? "s" : ""}`}
      title={`${count} comment${count > 1 ? "s" : ""}`}
    >
      {count}
    </button>
  );
}
