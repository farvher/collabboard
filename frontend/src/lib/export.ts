import { toPng, toBlob } from "html-to-image";
import { api } from "@/lib/api";

export interface ExportOptions {
  scale?: number;
  includeBackground?: boolean;
}

/**
 * Export the React Flow canvas to a PNG image (client-side).
 */
export async function exportToPng(options: ExportOptions = {}): Promise<void> {
  const { scale = 2, includeBackground = true } = options;

  const viewport = document.querySelector(".react-flow__viewport") as HTMLElement;
  if (!viewport) throw new Error("Canvas viewport not found");

  const dataUrl = await toPng(viewport, {
    backgroundColor: includeBackground ? "#f9fafb" : undefined,
    pixelRatio: scale,
    filter: (node) => {
      // Exclude controls and minimap from export
      const className = node.className?.toString() || "";
      return !className.includes("react-flow__controls") &&
             !className.includes("react-flow__minimap");
    },
  });

  // Download
  const link = document.createElement("a");
  link.download = `board-export-${Date.now()}.png`;
  link.href = dataUrl;
  link.click();
}

/**
 * Export the canvas to PDF via the backend.
 */
export async function exportToPdf(boardId: string): Promise<void> {
  const result = await api.post<{ url: string; key: string }>(
    `/api/boards/${boardId}/export?format=pdf`
  );

  // Download from presigned URL
  const link = document.createElement("a");
  link.download = `board-export-${Date.now()}.pdf`;
  link.href = result.url;
  link.target = "_blank";
  link.click();
}
