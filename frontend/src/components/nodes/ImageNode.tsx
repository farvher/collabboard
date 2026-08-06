import { memo, useState, useCallback, useRef } from "react";
import { Handle, Position, type NodeProps, NodeResizer } from "@xyflow/react";
import { uploadImage, validateImageFile } from "@/lib/storage";

function ImageNode({ data, selected }: NodeProps) {
  const src = (data?.src as string) || "";
  const alt = (data?.label as string) || "Image";
  const boardId = (data?.boardId as string) || "";

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    if (!boardId) {
      setUploadError("Board context not available");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const result = await uploadImage(boardId, file);
      data.src = result.url;
      data.storageKey = result.key;
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, [boardId, data]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!src) fileInputRef.current?.click();
  }, [src]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div
      className={`relative min-w-[80px] min-h-[80px] ${selected ? "ring-2 ring-blue-500 ring-offset-2 rounded" : ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={80}
        minHeight={80}
        lineClassName="!border-blue-400"
        handleClassName="!w-3 !h-3 !bg-blue-500 !border-blue-500"
      />

      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-blue-500" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-blue-500" />

      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain rounded"
          style={{ minWidth: 80, minHeight: 80 }}
        />
      ) : (
        <div
          onClick={handleClick}
          className={`w-[160px] h-[120px] flex flex-col items-center justify-center rounded border-2 border-dashed cursor-pointer transition-colors ${
            isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-100"
          } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
        >
          {isUploading ? (
            <>
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-blue-600 mt-2">Uploading...</span>
            </>
          ) : (
            <>
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" />
              </svg>
              <span className="text-xs text-gray-500 mt-1">
                {isDragOver ? "Drop here" : "Click or drop image"}
              </span>
            </>
          )}
          {uploadError && (
            <span className="text-xs text-red-500 mt-1 px-2 text-center">{uploadError}</span>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
        onChange={handleFileInput}
        className="hidden"
      />

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-blue-500" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-blue-500" />
    </div>
  );
}

export default memo(ImageNode);
