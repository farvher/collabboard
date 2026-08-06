"use client";

import { useEffect, useState } from "react";
import { useOrgStore, type OrgInfo } from "@/stores/org-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function OrganizationsPage() {
  const { organizations, fetchOrgs, createOrg, deleteOrg, isLoading, error, clearError } = useOrgStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createOrg(newOrgName);
      setNewOrgName("");
      setShowCreate(false);
    } catch {
      // error set in store
    }
  }

  async function handleDelete(org: OrgInfo) {
    if (confirm(`Delete "${org.name}"? This cannot be undone.`)) {
      await deleteOrg(org.id);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
          <p className="mt-1 text-gray-600">Manage your teams and organizations</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>New Organization</Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button onClick={clearError} className="ml-2 font-medium underline">Dismiss</button>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <Card className="mb-6">
          <CardContent className="pt-4">
            <form onSubmit={handleCreate} className="flex items-end gap-4">
              <div className="flex-1">
                <Input
                  label="Organization name"
                  placeholder="My Team"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" isLoading={isLoading}>Create</Button>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Org list */}
      {organizations.length === 0 && !isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <h3 className="text-lg font-medium text-gray-900">No organizations yet</h3>
            <p className="mt-1 text-sm text-gray-500">Create your first organization to get started</p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>Create Organization</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org) => (
            <Card key={org.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{org.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">/{org.slug}</p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                    {org.currentUserRole}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  {org.currentUserRole === "ADMIN" && (
                    <Button size="sm" variant="danger" onClick={() => handleDelete(org)}>
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
