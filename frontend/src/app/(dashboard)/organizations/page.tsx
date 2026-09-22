"use client";

import { useEffect, useState } from "react";
import { useOrgStore, type OrgInfo, type OrgMemberInfo } from "@/stores/org-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { api } from "@/lib/api";

interface UserResult {
  id: string;
  email: string;
  displayName: string;
}

export default function OrganizationsPage() {
  const {
    organizations, fetchOrgs, createOrg, deleteOrg,
    members, fetchMembers, addMember, updateMemberRole, removeMember,
    isLoading, error, clearError,
  } = useOrgStore();

  const [showCreate, setShowCreate] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<OrgInfo | null>(null);

  // Add member form
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState<"ADMIN" | "MEMBER" | "GUEST">("MEMBER");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // User search autocomplete
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  useEffect(() => {
    if (selectedOrg) fetchMembers(selectedOrg.id);
  }, [selectedOrg, fetchMembers]);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await api.get<UserResult[]>(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(results);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createOrg(newOrgName);
      setNewOrgName("");
      setShowCreate(false);
    } catch {}
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrg || !addEmail.trim()) return;
    setAddError("");
    setAddLoading(true);
    try {
      await addMember(selectedOrg.id, addEmail.trim(), addRole);
      setAddEmail("");
      setSearchQuery("");
      setSearchResults([]);
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setAddLoading(false);
    }
  }

  function selectUser(user: UserResult) {
    setAddEmail(user.email);
    setSearchQuery(user.displayName || user.email);
    setSearchResults([]);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Organizations</h1>
          <p className="mt-1 text-[var(--color-text-secondary)]">Manage your teams and members</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>New Organization</Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-[var(--color-danger-light)] p-3 text-sm text-[var(--color-danger-text)]" role="alert">
          {error}
          <button onClick={clearError} className="ml-2 font-medium underline">Dismiss</button>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <Card className="mb-6">
          <CardContent className="pt-4">
            <form onSubmit={handleCreate} className="flex items-end gap-4">
              <div className="flex-1">
                <Input label="Organization name" placeholder="My Team"
                  value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} required />
              </div>
              <Button type="submit" isLoading={isLoading}>Create</Button>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── Org list ─── */}
        <div className="lg:col-span-1 space-y-3">
          {organizations.length === 0 && !isLoading ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-sm text-[var(--color-text-muted)]">No organizations yet</p>
                <Button className="mt-3" size="sm" onClick={() => setShowCreate(true)}>Create one</Button>
              </CardContent>
            </Card>
          ) : (
            organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => setSelectedOrg(org)}
                className={`w-full text-left rounded-xl border p-4 transition-colors ${
                  selectedOrg?.id === org.id
                    ? "border-[var(--color-brand)] bg-[var(--color-brand-light)]"
                    : "border-[var(--color-border-primary)] bg-[var(--color-surface-card)] hover:bg-[var(--color-bg-hover)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--color-text-primary)] truncate">{org.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">/{org.slug}</p>
                  </div>
                  <span className={`ml-2 shrink-0 text-xs px-2 py-1 rounded-full font-medium ${
                    org.currentUserRole === "ADMIN"
                      ? "bg-[var(--color-brand-light)] text-[var(--color-brand-text)]"
                      : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
                  }`}>
                    {org.currentUserRole}
                  </span>
                </div>
                {org.currentUserRole === "ADMIN" && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${org.name}"? This cannot be undone.`)) deleteOrg(org.id);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && e.currentTarget.click()}
                    className="mt-2 inline-block text-xs text-[var(--color-danger-text)] hover:underline cursor-pointer"
                  >
                    Delete organization
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* ─── Members panel ─── */}
        <div className="lg:col-span-2">
          {!selectedOrg ? (
            <Card>
              <CardContent className="py-16 text-center">
                <svg className="w-10 h-10 mx-auto mb-3 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <p className="text-sm text-[var(--color-text-muted)]">Select an organization to manage its members</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-4">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-5">
                  Members · {selectedOrg.name}
                </h3>

                {/* Add member (ADMIN only) */}
                {selectedOrg.currentUserRole === "ADMIN" && (
                  <form onSubmit={handleAddMember} className="mb-6 p-4 rounded-xl bg-[var(--color-bg-secondary)] space-y-3">
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Add a member</p>

                    {/* Search input + autocomplete */}
                    <div className="relative">
                      <Input
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setAddEmail(e.target.value);
                        }}
                      />
                      {searchResults.length > 0 && (
                        <div className="absolute z-30 top-full mt-1 left-0 right-0 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg shadow-[var(--shadow-lg)] overflow-hidden">
                          {searchResults.map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => selectUser(u)}
                              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[var(--color-bg-hover)] text-left transition-colors"
                            >
                              <Avatar name={u.displayName || u.email} size="sm" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                                  {u.displayName || u.email}
                                </p>
                                <p className="text-xs text-[var(--color-text-muted)] truncate">{u.email}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {searching && (
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">Searching...</p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <select
                        value={addRole}
                        onChange={(e) => setAddRole(e.target.value as "ADMIN" | "MEMBER" | "GUEST")}
                        className="rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] px-3 py-2 text-sm"
                        aria-label="Role"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                        <option value="GUEST">Guest (read-only)</option>
                      </select>
                      <Button type="submit" isLoading={addLoading} disabled={!addEmail.trim()}>
                        Add
                      </Button>
                    </div>

                    {addError && (
                      <p className="text-xs text-[var(--color-danger-text)]" role="alert">{addError}</p>
                    )}
                  </form>
                )}

                {/* Member list */}
                <div className="space-y-1">
                  {members.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-muted)] py-4 text-center">No members found</p>
                  ) : (
                    members.map((m) => (
                      <MemberRow
                        key={m.userId}
                        member={m}
                        isAdmin={selectedOrg.currentUserRole === "ADMIN"}
                        onChangeRole={(role) => updateMemberRole(selectedOrg.id, m.userId, role)}
                        onRemove={() => {
                          if (confirm(`Remove ${m.displayName || m.email} from ${selectedOrg.name}?`)) {
                            removeMember(selectedOrg.id, m.userId);
                          }
                        }}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function MemberRow({
  member, isAdmin, onChangeRole, onRemove,
}: {
  member: OrgMemberInfo;
  isAdmin: boolean;
  onChangeRole: (role: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors group">
      <Avatar name={member.displayName || member.email} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
          {member.displayName || member.email}
        </p>
        <p className="text-xs text-[var(--color-text-muted)] truncate">{member.email}</p>
      </div>

      {isAdmin ? (
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <select
            value={member.role}
            onChange={(e) => onChangeRole(e.target.value)}
            className="text-xs rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] px-2 py-1"
            aria-label="Change role"
          >
            <option value="ADMIN">Admin</option>
            <option value="MEMBER">Member</option>
            <option value="GUEST">Guest</option>
          </select>
          <button
            onClick={onRemove}
            className="text-xs text-[var(--color-danger-text)] hover:bg-[var(--color-danger-light)] px-2 py-1 rounded-lg transition-colors"
            aria-label="Remove member"
          >
            Remove
          </button>
        </div>
      ) : (
        <span className="text-xs text-[var(--color-text-muted)] px-2 py-1 rounded-full bg-[var(--color-bg-tertiary)]">
          {member.role}
        </span>
      )}
    </div>
  );
}
