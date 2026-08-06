"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useCanvasPersistence, type SaveStatus } from "@/hooks/useCanvasPersistence";

const BoardCanvas = dynamic(
  () => import("@/components/canvas/BoardCanvas"),
  { ssr: false }
);
const VersionHistoryPanel = dynamic(
  () => import("@/components/panels/VersionHistoryPanel"),
  { ssr: false }
);

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { saveStatus, save, reload, lastSavedBy } = useCanvasPersistence(id);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      {/* Canvas header */}
      <div className="flex items-center justify-between h-12 px-4 border-b border-gray-200 bg-white z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/boards")}
            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h1 className="text-sm font-medium text-gray-900">Board Canvas</h1>
        </div>

        <div className="flex items-center gap-3">
          <SaveStatusBadge status={saveStatus} lastSavedBy={lastSavedBy} />

          {saveStatus === "conflict" && (
            <button
              onClick={reload}
              className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg hover:bg-yellow-200"
            >
              Reload latest
            </button>
          )}

          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              showHistory ? "bg-gray-200 text-gray-800" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            title="Version history"
          >
            <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History
          </button>

          <button
            onClick={save}
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save (Ctrl+S)
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative">
        <BoardCanvas boardId={id} />
        <VersionHistoryPanel
          boardId={id}
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
        />
      </div>
    </div>
  );
}

function SaveStatusBadge({ status, lastSavedBy }: { status: SaveStatus; lastSavedBy: string | null }) {
  const config: Record<SaveStatus, { label: string; color: string }> = {
    saved: { label: "Saved", color: "text-green-600" },
    saving: { label: "Saving...", color: "text-blue-600" },
    unsaved: { label: "Unsaved changes", color: "text-yellow-600" },
    error: { label: "Save failed", color: "text-red-600" },
    conflict: { label: "Conflict detected", color: "text-yellow-700" },
  };

  const { label, color } = config[status];

  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs font-medium ${color}`}>
        {status === "saved" && "✓ "}
        {status === "saving" && "⟳ "}
        {status === "unsaved" && "• "}
        {status === "error" && "✕ "}
        {status === "conflict" && "⚠ "}
        {label}
      </span>
      {lastSavedBy && status === "saved" && (
        <span className="text-xs text-gray-400">by {lastSavedBy}</span>
      )}
    </div>
  );
}
