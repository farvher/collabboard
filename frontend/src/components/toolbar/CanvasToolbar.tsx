"use client";

import { useState } from "react";
import { useCanvasStore, type CanvasTool } from "@/stores/canvas-store";

interface ToolDef {
  id: CanvasTool;
  label: string;
  icon: React.ReactNode;
  group?: string;
}

const tools: ToolDef[] = [
  {
    id: "select", label: "Select", group: "basic",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />,
  },
  {
    id: "rectangle", label: "Rectangle", group: "shapes",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />,
  },
  {
    id: "circle", label: "Circle", group: "shapes",
    icon: <circle cx="12" cy="12" r="9" />,
  },
  {
    id: "diamond", label: "Diamond", group: "shapes",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l9 9-9 9-9-9 9-9z" />,
  },
  {
    id: "text", label: "Text Box", group: "shapes",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />,
  },
  {
    id: "stickyNote", label: "Sticky Note", group: "advanced",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />,
  },
  {
    id: "freeText", label: "Free Text", group: "advanced",
    icon: <><path strokeLinecap="round" strokeLinejoin="round" d="M4 7V4h16v3" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m-4 0h8" /></>,
  },
  {
    id: "frame", label: "Frame", group: "advanced",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" />,
  },
  {
    id: "image", label: "Image", group: "advanced",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" />,
  },
  {
    id: "icon", label: "Icon", group: "advanced",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />,
  },
  {
    id: "connection", label: "Connect", group: "connect",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.02a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.757 8.81" />,
  },
];

// On small screens, show only the first 6 tools; rest go into overflow
const COMPACT_VISIBLE_COUNT = 6;

export default function CanvasToolbar() {
  const { selectedTool, setSelectedTool, deleteSelected } = useCanvasStore();
  const [showOverflow, setShowOverflow] = useState(false);

  const visibleTools = tools.slice(0, COMPACT_VISIBLE_COUNT);
  const overflowTools = tools.slice(COMPACT_VISIBLE_COUNT);

  return (
    <div
      className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-0.5 bg-[var(--color-bg-primary)] rounded-xl shadow-[var(--shadow-lg)] border border-[var(--color-border-primary)] p-1.5 transition-theme"
      role="toolbar"
      aria-label="Canvas tools"
      aria-orientation="vertical"
    >
      {/* Always visible tools */}
      {visibleTools.map((tool, i) => {
        const prevGroup = i > 0 ? visibleTools[i - 1].group : tool.group;
        const showDivider = prevGroup !== tool.group;
        return (
          <div key={tool.id}>
            {showDivider && <div className="border-t border-[var(--color-border-primary)] my-1" aria-hidden="true" />}
            <ToolButton tool={tool} selectedTool={selectedTool} onClick={() => setSelectedTool(tool.id)} />
          </div>
        );
      })}

      {/* Overflow tools — hidden on small screens unless expanded */}
      <div className="hidden sm:contents">
        {overflowTools.map((tool, i) => {
          const prevGroup = i > 0 ? overflowTools[i - 1].group : visibleTools[visibleTools.length - 1]?.group;
          const showDivider = prevGroup !== tool.group;
          return (
            <div key={tool.id}>
              {showDivider && <div className="border-t border-[var(--color-border-primary)] my-1" aria-hidden="true" />}
              <ToolButton tool={tool} selectedTool={selectedTool} onClick={() => setSelectedTool(tool.id)} />
            </div>
          );
        })}
      </div>

      {/* Mobile overflow toggle */}
      {overflowTools.length > 0 && (
        <div className="sm:hidden">
          <div className="border-t border-[var(--color-border-primary)] my-1" aria-hidden="true" />
          <button
            onClick={() => setShowOverflow(!showOverflow)}
            title={showOverflow ? "Hide more tools" : "More tools"}
            aria-expanded={showOverflow}
            aria-label="More tools"
            className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors w-full flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d={showOverflow ? "M4.5 15.75l7.5-7.5 7.5 7.5" : "M19.5 8.25l-7.5 7.5-7.5-7.5"} />
            </svg>
          </button>

          {showOverflow && overflowTools.map((tool) => (
            <ToolButton
              key={tool.id}
              tool={tool}
              selectedTool={selectedTool}
              onClick={() => { setSelectedTool(tool.id); setShowOverflow(false); }}
            />
          ))}
        </div>
      )}

      <div className="border-t border-[var(--color-border-primary)] my-1" aria-hidden="true" />
      <button
        onClick={deleteSelected}
        title="Delete selected (Del)"
        aria-label="Delete selected elements"
        className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-danger-light)] hover:text-[var(--color-danger)] transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      </button>
    </div>
  );
}

function ToolButton({
  tool,
  selectedTool,
  onClick,
}: {
  tool: ToolDef;
  selectedTool: CanvasTool;
  onClick: () => void;
}) {
  const isActive = selectedTool === tool.id;
  return (
    <button
      onClick={onClick}
      title={tool.label}
      aria-label={tool.label}
      aria-pressed={isActive}
      className={`p-2 rounded-lg transition-colors ${
        isActive
          ? "bg-[var(--color-brand-light)] text-[var(--color-brand-text)]"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
      }`}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        {tool.icon}
      </svg>
    </button>
  );
}
