"use client";

import { useCanvasStore } from "@/stores/canvas-store";
import { STICKY_COLORS } from "@/components/nodes/StickyNoteNode";
import { ICONS } from "@/components/nodes/IconNode";

export default function PropertiesPanel() {
  const { nodes, updateNodeData } = useCanvasStore();

  const selectedNode = nodes.find((n) => n.selected);

  if (!selectedNode) {
    return (
      <div className="absolute right-4 top-16 z-10 w-56 bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <p className="text-xs text-gray-400 text-center">Select a node to edit properties</p>
      </div>
    );
  }

  const { type, data, id } = selectedNode;

  function update(key: string, value: unknown) {
    updateNodeData(id, { [key]: value });
  }

  return (
    <div className="absolute right-4 top-16 z-10 w-60 bg-white rounded-xl shadow-lg border border-gray-200 p-4 space-y-4 max-h-[70vh] overflow-y-auto">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 capitalize">{type}</h3>
        <p className="text-xs text-gray-400">ID: {id.slice(0, 12)}...</p>
      </div>

      {/* Label */}
      {type !== "frame" && type !== "image" && type !== "icon" && (
        <Field label="Label">
          <input
            type="text"
            value={(data?.label as string) || ""}
            onChange={(e) => update("label", e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
          />
        </Field>
      )}

      {/* Color (for sticky notes, rectangles, circles, diamonds) */}
      {(type === "stickyNote" || type === "rectangle" || type === "circle" || type === "diamond") && (
        <Field label="Color">
          <div className="flex gap-1.5 flex-wrap">
            {(type === "stickyNote" ? STICKY_COLORS : BASIC_COLORS).map((c) => (
              <button
                key={c.value}
                onClick={() => update("color", c.value)}
                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                  (data?.color || (type === "stickyNote" ? "#fef08a" : "#ffffff")) === c.value
                    ? "border-gray-800 scale-110"
                    : "border-gray-300"
                }`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            ))}
          </div>
        </Field>
      )}

      {/* Font size (for freeText, text) */}
      {(type === "freeText" || type === "text") && (
        <Field label="Font Size">
          <input
            type="number"
            min={10}
            max={72}
            value={(data?.fontSize as number) || 16}
            onChange={(e) => update("fontSize", Number(e.target.value))}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
          />
        </Field>
      )}

      {/* Font weight (for freeText, text) */}
      {(type === "freeText" || type === "text") && (
        <Field label="Font Weight">
          <select
            value={(data?.fontWeight as string) || "normal"}
            onChange={(e) => update("fontWeight", e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
            <option value="lighter">Light</option>
          </select>
        </Field>
      )}

      {/* Text color for freeText */}
      {type === "freeText" && (
        <Field label="Text Color">
          <input
            type="color"
            value={(data?.color as string) || "#1f2937"}
            onChange={(e) => update("color", e.target.value)}
            className="w-full h-8 rounded border border-gray-300 cursor-pointer"
          />
        </Field>
      )}

      {/* Icon selector */}
      {type === "icon" && (
        <>
          <Field label="Icon">
            <div className="grid grid-cols-4 gap-1">
              {Object.keys(ICONS).map((iconName) => (
                <button
                  key={iconName}
                  onClick={() => update("icon", iconName)}
                  className={`p-1.5 rounded border text-xs ${
                    (data?.icon || "star") === iconName
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  title={iconName}
                >
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[iconName]} />
                  </svg>
                </button>
              ))}
            </div>
          </Field>
          <Field label="Icon Color">
            <input
              type="color"
              value={(data?.color as string) || "#3b82f6"}
              onChange={(e) => update("color", e.target.value)}
              className="w-full h-8 rounded border border-gray-300 cursor-pointer"
            />
          </Field>
          <Field label="Size">
            <input
              type="range"
              min={20}
              max={80}
              value={(data?.size as number) || 40}
              onChange={(e) => update("size", Number(e.target.value))}
              className="w-full"
            />
            <span className="text-xs text-gray-500">{(data?.size as number) || 40}px</span>
          </Field>
        </>
      )}

      {/* Image source */}
      {type === "image" && (
        <Field label="Image URL">
          <input
            type="url"
            value={(data?.src as string) || ""}
            onChange={(e) => update("src", e.target.value)}
            placeholder="https://..."
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
          />
        </Field>
      )}

      {/* Frame label */}
      {type === "frame" && (
        <Field label="Frame Label">
          <input
            type="text"
            value={(data?.label as string) || ""}
            onChange={(e) => update("label", e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
          />
        </Field>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

const BASIC_COLORS = [
  { name: "White", value: "#ffffff" },
  { name: "Red", value: "#fee2e2" },
  { name: "Blue", value: "#dbeafe" },
  { name: "Green", value: "#dcfce7" },
  { name: "Yellow", value: "#fef9c3" },
  { name: "Purple", value: "#f3e8ff" },
  { name: "Gray", value: "#f3f4f6" },
];
