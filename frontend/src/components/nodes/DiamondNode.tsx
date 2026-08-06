import { memo, useState, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

function DiamondNode({ data, selected }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState((data?.label as string) || "");

  const handleDoubleClick = useCallback(() => setIsEditing(true), []);
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    data.label = label;
  }, [data, label]);
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") { setIsEditing(false); data.label = label; }
    },
    [data, label]
  );

  return (
    <div className="relative w-[100px] h-[100px]" onDoubleClick={handleDoubleClick}>
      <div
        className={`absolute inset-0 rotate-45 border-2 bg-white shadow-sm transition-colors ${
          selected ? "border-blue-500 shadow-md" : "border-gray-300"
        }`}
        style={{ backgroundColor: (data?.color as string) || "#ffffff" }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        {isEditing ? (
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-14 text-center text-xs bg-transparent outline-none border-b border-blue-400 relative z-10"
          />
        ) : (
          <span className="text-xs text-gray-800 text-center select-none relative z-10 px-1">
            {label || "?"}
          </span>
        )}
      </div>

      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-blue-500" style={{ top: 0 }} />
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-blue-500" style={{ left: 0 }} />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-blue-500" style={{ bottom: 0 }} />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-blue-500" style={{ right: 0 }} />
    </div>
  );
}

export default memo(DiamondNode);
