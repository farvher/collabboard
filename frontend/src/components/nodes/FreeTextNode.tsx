import { memo, useState, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

function FreeTextNode({ data, selected }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState((data?.label as string) || "");

  const fontSize = (data?.fontSize as number) || 16;
  const fontWeight = (data?.fontWeight as string) || "normal";
  const color = (data?.color as string) || "#1f2937";

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
      className={`min-w-[60px] px-2 py-1 ${selected ? "ring-2 ring-blue-400 ring-offset-2 rounded" : ""}`}
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
          rows={3}
          className="w-full text-sm bg-transparent outline-none border border-blue-300 rounded px-1 py-0.5 resize-both min-w-[100px]"
          style={{ fontSize: `${fontSize}px`, fontWeight, color }}
        />
      ) : (
        <span
          className="select-none whitespace-pre-wrap"
          style={{ fontSize: `${fontSize}px`, fontWeight, color }}
        >
          {label || "Free Text"}
        </span>
      )}

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-blue-500 !opacity-0 hover:!opacity-100" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-blue-500 !opacity-0 hover:!opacity-100" />
    </div>
  );
}

export default memo(FreeTextNode);
