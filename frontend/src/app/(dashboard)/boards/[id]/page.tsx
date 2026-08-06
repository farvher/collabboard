"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useCanvasPersistence, type SaveStatus } from "@/hooks/useCanvasPersistence";
import { exportToPng, exportToPdf } from "@/lib/export";

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
  const { saveStatus, save, forceSave, reload, lastSavedBy, remoteVersion, remoteSavedBy } = useCanvasPersistence(id);
  const [showHistory, setShowHistory] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
            <div className="flex items-center gap-2">
              <button
                onClick={reload}
                className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg hover:bg-yellow-200"
              >
                Reload (lose my changes)
              </button>
              <button
                onClick={forceSave}
                className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-lg hover:bg-orange-200"
              >
                Force save (overwrite)
              </button>
            </div>
          )}

          {saveStatus === "stale" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-yellow-700">
                New changes by {remoteSavedBy || "someone"} (v{remoteVersion})
              </span>
              <button
                onClick={reload}
                className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-200"
              >
                Reload
              </button>
            </div>
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

          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              title="Export"
            >
              <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 w-40">
                <button
                  onClick={async () => {
                    setShowExportMenu(false);
                    setIsExporting(true);
                    try { await exportToPng(); } catch { /* ignore */ }
                    setIsExporting(false);
                  }}
                  disabled={isExporting}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" />
                  </svg>
                  Export PNG
                </button>
                <button
                  onClick={async () => {
                    setShowExportMenu(false);
                    setIsExporting(true);
                    try { await exportToPdf(id); } catch { /* ignore */ }
                    setIsExporting(false);
                  }}
                  disabled={isExporting}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  Export PDF
                </button>
              </div>
            )}
          </div>

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
    conflict: { label: "Conflict detected", color: "text-orange-700" },
    stale: { label: "New version available", color: "text-yellow-700" },
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
        {status === "stale" && "↓ "}
        {label}
      </span>
      {lastSavedBy && status === "saved" && (
        <span className="text-xs text-gray-400">by {lastSavedBy}</span>
      )}
    </div>
  );
}
