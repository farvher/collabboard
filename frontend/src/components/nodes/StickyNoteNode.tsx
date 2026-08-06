import { memo, useState, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

const STICKY_COLORS = [
  { name: "Yellow", value: "#fef08a" },
  { name: "Pink", value: "#fda4af" },
  { name: "Green", value: "#86efac" },
  { name: "Blue", value: "#93c5fd" },
  { name: "Orange", value: "#fdba74" },
];

function StickyNoteNode({ data, selected }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState((data?.label as string) || "");

  const color = (data?.color as string) || STICKY_COLORS[0].value;

  const handleDoubleClick = useCallback(() => setIsEditing(true), []);
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    data.label = label;
  }, [data, label]);
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") { setIsEditing(false); data.label = label; }
    },
    [data, label]
  );

  return (
    <div
      className={`w-[150px] h-[150px] p-3 flex items-center justify-center rounded-sm shadow-md transition-shadow ${
        selected ? "ring-2 ring-blue-500 ring-offset-2" : ""
      }`}
      style={{ backgroundColor: color }}
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-gray-600 !opacity-0 hover:!opacity-100" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-gray-600 !opacity-0 hover:!opacity-100" />

      {isEditing ? (
        <textarea
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full h-full text-sm bg-transparent outline-none resize-none text-gray-800"
          placeholder="Type here..."
        />
      ) : (
        <span className="text-sm text-gray-800 text-center select-none whitespace-pre-wrap break-words overflow-hidden">
          {label || "Note"}
        </span>
      )}

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-gray-600 !opacity-0 hover:!opacity-100" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-gray-600 !opacity-0 hover:!opacity-100" />
    </div>
  );
}

export default memo(StickyNoteNode);
export { STICKY_COLORS };
