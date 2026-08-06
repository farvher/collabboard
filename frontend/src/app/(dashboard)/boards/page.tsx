"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useOrgStore } from "@/stores/org-store";
import { useBoardStore, type BoardInfo } from "@/stores/board-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import TemplateGallery from "@/components/panels/TemplateGallery";

export default function BoardsPage() {
  const router = useRouter();
  const { currentOrg } = useOrgStore();
  const { boards, fetchBoards, createBoard, deleteBoard, isLoading, error, clearError } = useBoardStore();

  const [showCreate, setShowCreate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [search, setSearch] = useState("");

  const loadBoards = useCallback(() => {
    if (currentOrg) {
      fetchBoards(currentOrg.id, search || undefined);
    }
  }, [currentOrg, search, fetchBoards]);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrg) return;
    try {
      await createBoard(currentOrg.id, newName, newDescription || undefined, selectedTemplateId || undefined);
      setNewName("");
      setNewDescription("");
      setShowCreate(false);
      setShowTemplates(false);
      setSelectedTemplateId(null);
    } catch {
      // error in store
    }
  }

  function handleTemplateSelect(templateId: string | null) {
    setSelectedTemplateId(templateId);
    setShowTemplates(false);
    setShowCreate(true);
  }

  function handleNewBoard() {
    setShowTemplates(true);
    setShowCreate(false);
  }

  async function handleDelete(board: BoardInfo) {
    if (confirm(`Delete "${board.name}"? This cannot be undone.`)) {
      await deleteBoard(board.id);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadBoards();
  }

  if (!currentOrg) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-medium text-gray-900">No organization selected</h2>
        <p className="mt-1 text-sm text-gray-500">Create or select an organization to view boards</p>
        <Button className="mt-4" onClick={() => router.push("/organizations")}>
          Go to Organizations
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Boards</h1>
          <p className="mt-1 text-gray-600">{currentOrg.name}</p>
        </div>
        <Button onClick={handleNewBoard}>New Board</Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <Input
            placeholder="Search boards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="secondary">Search</Button>
        </div>
      </form>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button onClick={clearError} className="ml-2 font-medium underline">Dismiss</button>
        </div>
      )}

      {/* Template gallery */}
      {showTemplates && (
        <Card className="mb-6">
          <CardContent className="pt-4">
            <TemplateGallery
              onSelect={handleTemplateSelect}
              onCancel={() => setShowTemplates(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Create form */}
      {showCreate && (
        <Card className="mb-6">
          <CardContent className="pt-4">
            <form onSubmit={handleCreate} className="space-y-3">
              <Input
                label="Board name"
                placeholder="My Diagram"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <Input
                label="Description (optional)"
                placeholder="What is this board about?"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
              <div className="flex gap-2">
                <Button type="submit" isLoading={isLoading}>Create</Button>
                <Button type="button" variant="ghost" onClick={() => { setShowCreate(false); setSelectedTemplateId(null); }}>Cancel</Button>
                {selectedTemplateId && (
                  <span className="text-xs text-blue-600 self-center">Using template</span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Board grid */}
      {boards.length === 0 && !isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-blue-50 p-4 mb-4">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {search ? "No boards found" : "No boards yet"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {search ? "Try a different search term" : "Create your first board to get started"}
            </p>
            {!search && (
              <Button className="mt-4" onClick={handleNewBoard}>Create Board</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {boards.map((board) => (
            <Card key={board.id} className="hover:shadow-md transition-shadow cursor-pointer group">
              <div
                onClick={() => router.push(`/boards/${board.id}`)}
                className="h-32 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-t-xl flex items-center justify-center"
              >
                <svg className="h-12 w-12 text-blue-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
                </svg>
              </div>
              <CardContent className="pt-3">
                <h3 className="font-semibold text-gray-900 truncate">{board.name}</h3>
                {board.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{board.description}</p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {new Date(board.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(board.currentUserRole === "OWNER") && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(board); }}
                        className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
