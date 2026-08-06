"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useCanvasStore } from "@/stores/canvas-store";
import { api, ApiClientError } from "@/lib/api";

export type SaveStatus = "saved" | "saving" | "unsaved" | "error" | "conflict";

interface ContentResponse {
  boardId: string;
  canvasData: string;
  version: number;
  lastSavedByName: string | null;
  updatedAt: string;
}

interface CanvasData {
  nodes: unknown[];
  edges: unknown[];
  viewport?: { x: number; y: number; zoom: number };
}

export function useCanvasPersistence(boardId: string) {
  const { nodes, edges, loadCanvas } = useCanvasStore();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastSavedBy, setLastSavedBy] = useState<string | null>(null);
  const versionRef = useRef<number>(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadedRef = useRef(false);
  const prevDataRef = useRef<string>("");

  // Load canvas on mount
  useEffect(() => {
    async function load() {
      try {
        const content = await api.get<ContentResponse>(`/api/boards/${boardId}/content`);
        versionRef.current = content.version;
        setLastSavedBy(content.lastSavedByName);

        if (content.canvasData && content.canvasData !== "{}") {
          try {
            const parsed: CanvasData = JSON.parse(content.canvasData);
            loadCanvas(parsed.nodes as never[] || [], parsed.edges as never[] || []);
          } catch {
            loadCanvas([], []);
          }
        }
        isLoadedRef.current = true;
        prevDataRef.current = content.canvasData || "{}";
      } catch {
        // Board might not have content yet
        isLoadedRef.current = true;
      }
    }
    load();
  }, [boardId, loadCanvas]);

  // Save function
  const save = useCallback(async () => {
    if (!isLoadedRef.current) return;

    const canvasData = JSON.stringify({ nodes, edges });

    // Don't save if nothing changed
    if (canvasData === prevDataRef.current) {
      setSaveStatus("saved");
      return;
    }

    setSaveStatus("saving");
    try {
      const response = await api.put<ContentResponse>(`/api/boards/${boardId}/content`, {
        canvasData,
        expectedVersion: versionRef.current,
      });
      versionRef.current = response.version;
      setLastSavedBy(response.lastSavedByName);
      prevDataRef.current = canvasData;
      setSaveStatus("saved");
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 409) {
        setSaveStatus("conflict");
      } else {
        setSaveStatus("error");
      }
    }
  }, [boardId, nodes, edges]);

  // Auto-save with debounce (30s after last change)
  useEffect(() => {
    if (!isLoadedRef.current) return;

    const currentData = JSON.stringify({ nodes, edges });
    if (currentData === prevDataRef.current) return;

    setSaveStatus("unsaved");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      save();
    }, 30000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [nodes, edges, save]);

  // Ctrl+S handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [save]);

  // Reload on conflict
  const reload = useCallback(async () => {
    try {
      const content = await api.get<ContentResponse>(`/api/boards/${boardId}/content`);
      versionRef.current = content.version;
      if (content.canvasData && content.canvasData !== "{}") {
        const parsed: CanvasData = JSON.parse(content.canvasData);
        loadCanvas(parsed.nodes as never[] || [], parsed.edges as never[] || []);
      }
      prevDataRef.current = content.canvasData || "{}";
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }, [boardId, loadCanvas]);

  return { saveStatus, save, reload, lastSavedBy };
}
