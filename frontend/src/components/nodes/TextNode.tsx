import { memo, useState, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

function TextNode({ data, selected }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState((data?.label as string) || "");

  const handleDoubleClick = useCallback(() => setIsEditing(true), []);
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    data.label = label;
  }, [data, label]);
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) { setIsEditing(false); data.label = label; }
    },
    [data, label]
  );

  return (
    <div
      className={`px-3 py-2 min-w-[80px] transition-all ${
        selected ? "ring-2 ring-blue-400 ring-offset-2 rounded" : ""
      }`}
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-blue-500 !opacity-0 hover:!opacity-100" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-blue-500 !opacity-0 hover:!opacity-100" />

      {isEditing ? (
        <textarea
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          rows={2}
          className="w-full text-sm bg-transparent outline-none border border-blue-300 rounded px-1 py-0.5 resize-none"
        />
      ) : (
        <span
          className="text-sm text-gray-800 select-none whitespace-pre-wrap"
          style={{
            fontSize: (data?.fontSize as string) || "14px",
            fontWeight: (data?.fontWeight as string) || "normal",
          }}
        >
          {label || "Text"}
        </span>
      )}

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-blue-500 !opacity-0 hover:!opacity-100" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-blue-500 !opacity-0 hover:!opacity-100" />
    </div>
  );
}

export default memo(TextNode);
