import { memo, useState, useCallback } from "react";
import { type NodeProps, NodeResizer } from "@xyflow/react";

function FrameNode({ data, selected }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState((data?.label as string) || "");

  const handleDoubleClick = useCallback(() => setIsEditing(true), []);
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    data.label = label;
  }, [data, label]);

  return (
    <div
      className="w-full h-full min-w-[200px] min-h-[150px] relative"
      style={{ width: (data?.width as number) || 400, height: (data?.height as number) || 300 }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={150}
        lineClassName="!border-blue-400"
        handleClassName="!w-3 !h-3 !bg-blue-500 !border-blue-500"
      />

      {/* Frame border */}
      <div className={`absolute inset-0 border-2 border-dashed rounded-lg ${
        selected ? "border-blue-400 bg-blue-50/30" : "border-gray-300 bg-gray-50/20"
      }`} />

      {/* Frame label */}
      <div
        className="absolute -top-6 left-2 px-2 py-0.5"
        onDoubleClick={handleDoubleClick}
      >
        {isEditing ? (
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleBlur}
            autoFocus
            className="text-xs font-medium bg-white border border-blue-300 rounded px-1 outline-none"
          />
        ) : (
          <span className="text-xs font-medium text-gray-500 select-none">
            {label || "Frame"}
          </span>
        )}
      </div>
    </div>
  );
}

export default memo(FrameNode);
