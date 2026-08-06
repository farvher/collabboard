import { memo, useState, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

function RectangleNode({ data, selected }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState((data?.label as string) || "");

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    data.label = label;
  }, [data, label]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        setIsEditing(false);
        data.label = label;
      }
    },
    [data, label]
  );

  return (
    <div
      className={`px-4 py-3 min-w-[120px] min-h-[60px] flex items-center justify-center rounded-lg border-2 bg-white shadow-sm transition-colors ${
        selected ? "border-blue-500 shadow-md" : "border-gray-300"
      }`}
      style={{
        backgroundColor: (data?.color as string) || "#ffffff",
      }}
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-blue-500" />
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-blue-500" />

      {isEditing ? (
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full text-center text-sm bg-transparent outline-none border-b border-blue-400"
        />
      ) : (
        <span className="text-sm text-gray-800 text-center select-none">
          {label || "Rectangle"}
        </span>
      )}

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-blue-500" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-blue-500" />
    </div>
  );
}

export default memo(RectangleNode);
