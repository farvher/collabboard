"use client";

import { useEffect, useState } from "react";
import { useCommentStore, type CommentInfo } from "@/stores/comment-store";
import { useAuthStore } from "@/stores/auth-store";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface CommentPanelProps {
  boardId: string;
}

export default function CommentPanel({ boardId }: CommentPanelProps) {
  const { comments, isLoading, error, activeNodeId, panelOpen, fetchComments, createComment, resolveComment, deleteComment, closePanel, clearError } = useCommentStore();
  const { user } = useAuthStore();
  const [newContent, setNewContent] = useState("");

  useEffect(() => {
    if (panelOpen && activeNodeId) {
      fetchComments(boardId, activeNodeId);
    }
  }, [panelOpen, activeNodeId, boardId, fetchComments]);

  if (!panelOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newContent.trim() || !activeNodeId) return;
    try {
      await createComment(boardId, activeNodeId, newContent.trim());
      setNewContent("");
    } catch {
      // error in store
    }
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  }

  return (
    <aside
      className="absolute right-0 top-0 bottom-0 z-20 w-80 flex flex-col border-l border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] shadow-[var(--shadow-lg)] transition-theme"
      role="complementary"
      aria-label="Comments panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-secondary)]">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Comments
        </h3>
        <button
          onClick={closePanel}
          className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]"
          aria-label="Close comments panel"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-[var(--color-danger-light)] text-[var(--color-danger-text)] text-xs" role="alert">
          {error}
          <button onClick={clearError} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {isLoading && comments.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-4">Loading...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-4">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isOwner={user?.id === comment.userId}
              onResolve={() => resolveComment(comment.id)}
              onDelete={() => deleteComment(comment.id)}
              formatTime={formatTime}
            />
          ))
        )}
      </div>

      {/* New comment input */}
      <form onSubmit={handleSubmit} className="border-t border-[var(--color-border-secondary)] p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
            aria-label="New comment"
          />
          <Button type="submit" size="sm" disabled={!newContent.trim() || isLoading}>
            Send
          </Button>
        </div>
      </form>
    </aside>
  );
}

function CommentItem({
  comment,
  isOwner,
  onResolve,
  onDelete,
  formatTime,
}: {
  comment: CommentInfo;
  isOwner: boolean;
  onResolve: () => void;
  onDelete: () => void;
  formatTime: (d: string) => string;
}) {
  return (
    <div
      className={`rounded-lg p-3 text-sm transition-colors ${
        comment.resolved
          ? "bg-[var(--color-bg-tertiary)] opacity-60"
          : "bg-[var(--color-bg-secondary)]"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Avatar name={comment.userName} size="sm" />
        <span className="font-medium text-[var(--color-text-primary)] text-xs">{comment.userName}</span>
        <span className="text-[var(--color-text-muted)] text-xs ml-auto">{formatTime(comment.createdAt)}</span>
      </div>
      <p className={`text-[var(--color-text-secondary)] ${comment.resolved ? "line-through" : ""}`}>
        {comment.content}
      </p>
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={onResolve}
          className={`text-xs px-2 py-0.5 rounded transition-colors ${
            comment.resolved
              ? "text-[var(--color-brand-text)] hover:bg-[var(--color-brand-light)]"
              : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
          }`}
          aria-label={comment.resolved ? "Unresolve comment" : "Resolve comment"}
        >
          {comment.resolved ? "Reopen" : "Resolve"}
        </button>
        {isOwner && (
          <button
            onClick={onDelete}
            className="text-xs px-2 py-0.5 rounded text-[var(--color-danger-text)] hover:bg-[var(--color-danger-light)] transition-colors"
            aria-label="Delete comment"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
