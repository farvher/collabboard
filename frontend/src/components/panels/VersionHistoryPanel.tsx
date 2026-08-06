"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useCanvasStore } from "@/stores/canvas-store";
import { Button } from "@/components/ui/button";

interface VersionInfo {
  id: string;
  versionNumber: number;
  savedByName: string | null;
  createdAt: string;
}

interface VersionDetail {
  id: string;
  versionNumber: number;
  savedByName: string | null;
  canvasSnapshot: string;
  createdAt: string;
}

interface PageResponse {
  content: VersionInfo[];
  totalElements: number;
}

interface Props {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function VersionHistoryPanel({ boardId, isOpen, onClose }: Props) {
  const { loadCanvas } = useCanvasStore();
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const fetchVersions = useCallback(async () => {
    if (!boardId) return;
    setIsLoading(true);
    try {
      const data = await api.get<PageResponse>(`/api/boards/${boardId}/versions?size=50`);
      setVersions(data.content);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (isOpen) fetchVersions();
  }, [isOpen, fetchVersions]);

  async function handlePreview(versionId: string) {
    try {
      const detail = await api.get<VersionDetail>(`/api/boards/${boardId}/versions/${versionId}`);
      if (detail.canvasSnapshot) {
        const parsed = JSON.parse(detail.canvasSnapshot);
        loadCanvas(parsed.nodes || [], parsed.edges || []);
      }
      setPreviewing(versionId);
    } catch {
      // ignore
    }
  }

  async function handleRestore(versionId: string) {
    if (!confirm("Restore this version? Current changes will be saved as a new version first.")) return;
    setRestoring(true);
    try {
      const result = await api.post<{ canvasData: string; version: number }>(
        `/api/boards/${boardId}/versions/${versionId}/restore`
      );
      if (result.canvasData) {
        const parsed = JSON.parse(result.canvasData);
        loadCanvas(parsed.nodes || [], parsed.edges || []);
      }
      setPreviewing(null);
      await fetchVersions();
    } catch {
      // ignore
    } finally {
      setRestoring(false);
    }
  }

  async function handleCancelPreview() {
    // Reload current content
    try {
      const content = await api.get<{ canvasData: string }>(`/api/boards/${boardId}/content`);
      if (content.canvasData && content.canvasData !== "{}") {
        const parsed = JSON.parse(content.canvasData);
        loadCanvas(parsed.nodes || [], parsed.edges || []);
      }
    } catch {
      // ignore
    }
    setPreviewing(null);
  }

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-0 bottom-0 w-72 bg-white border-l border-gray-200 shadow-lg z-30 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Version History</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Preview banner */}
      {previewing && (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200 flex items-center justify-between">
          <span className="text-xs text-yellow-800">Previewing version</span>
          <button onClick={handleCancelPreview} className="text-xs text-yellow-700 underline">
            Cancel
          </button>
        </div>
      )}

      {/* Version list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : versions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No versions yet. Save the board to create one.</p>
        ) : (
          versions.map((v) => (
            <div
              key={v.id}
              className={`rounded-lg p-3 border transition-colors ${
                previewing === v.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">v{v.versionNumber}</span>
                <span className="text-xs text-gray-400">
                  {formatRelativeTime(v.createdAt)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {v.savedByName || "Unknown"}
              </p>
              <div className="mt-2 flex gap-1">
                <button
                  onClick={() => handlePreview(v.id)}
                  className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Preview
                </button>
                {previewing === v.id && (
                  <Button
                    size="sm"
                    onClick={() => handleRestore(v.id)}
                    isLoading={restoring}
                    className="!text-xs !px-2 !py-1"
                  >
                    Restore
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
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
