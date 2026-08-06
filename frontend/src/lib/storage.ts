import { getAccessToken } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface UploadResult {
  key: string;
  url: string;
}

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Invalid file type. Allowed: PNG, JPEG, GIF, WebP, SVG";
  }
  if (file.size > MAX_SIZE) {
    return "File too large. Maximum size: 10MB";
  }
  return null;
}

export async function uploadImage(boardId: string, file: File): Promise<UploadResult> {
  const error = validateImageFile(file);
  if (error) throw new Error(error);

  const token = getAccessToken();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/boards/${boardId}/images`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || `Upload failed: ${response.status}`);
  }

  return response.json();
}

export async function getPresignedUrl(key: string): Promise<string> {
  const token = getAccessToken();
  const response = await fetch(
    `${API_BASE_URL}/api/storage/presigned?key=${encodeURIComponent(key)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) throw new Error("Failed to get presigned URL");

  const data = await response.json();
  return data.url;
}
