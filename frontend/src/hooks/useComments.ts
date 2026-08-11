"use client";

import { useEffect } from "react";
import { useCommentStore } from "@/stores/comment-store";

/**
 * Hook to load and periodically refresh comment counts for a board.
 * Used in the canvas page to show badges on nodes.
 */
export function useComments(boardId: string) {
  const { fetchCommentCounts, commentCounts } = useCommentStore();

  useEffect(() => {
    if (!boardId) return;

    // Initial fetch
    fetchCommentCounts(boardId);

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchCommentCounts(boardId);
    }, 30000);

    return () => clearInterval(interval);
  }, [boardId, fetchCommentCounts]);

  return { commentCounts };
}
