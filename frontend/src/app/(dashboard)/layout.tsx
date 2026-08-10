"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useOrgStore, type OrgInfo } from "@/stores/org-store";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, hydrate } = useAuthStore();
  const { organizations, currentOrg, fetchOrgs, setCurrentOrg } = useOrgStore();
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
      } else {
        fetchOrgs();
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [router, fetchOrgs]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close org dropdown on outside click
  useEffect(() => {
    if (!showOrgDropdown) return;
    function handleClick() { setShowOrgDropdown(false); }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [showOrgDropdown]);

  // Escape key closes sidebar/dropdown
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSidebarOpen(false);
        setShowOrgDropdown(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleLogout() {
    logout();
    document.cookie = "isAuthenticated=; path=/; max-age=0";
    router.push("/login");
  }

  function handleOrgSwitch(org: OrgInfo) {
    setCurrentOrg(org);
    setShowOrgDropdown(false);
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-secondary)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-brand)] border-t-transparent" role="status" aria-label="Loading">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--color-bg-secondary)] transition-theme">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-[var(--color-surface-overlay)] lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Main navigation"
        role="navigation"
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-[var(--color-border-secondary)]">
          <Link href="/boards" className="text-xl font-bold text-[var(--color-text-primary)]">
            CollabBoard
          </Link>
          {/* Close button (mobile) */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] lg:hidden"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Org Switcher */}
        <div className="px-4 py-3 border-b border-[var(--color-border-secondary)] relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowOrgDropdown(!showOrgDropdown); }}
            className="flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
            aria-expanded={showOrgDropdown}
            aria-haspopup="listbox"
            aria-label="Switch organization"
          >
            <span className="truncate">{currentOrg?.name || "Select organization"}</span>
            <svg className="h-4 w-4 text-[var(--color-text-muted)] ml-2 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
            </svg>
          </button>

          {showOrgDropdown && (
            <div
              className="absolute left-4 right-4 top-full mt-1 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg shadow-[var(--shadow-lg)] z-50"
              role="listbox"
              aria-label="Organizations"
            >
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleOrgSwitch(org)}
                  role="option"
                  aria-selected={currentOrg?.id === org.id}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-bg-hover)] transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    currentOrg?.id === org.id
                      ? "bg-[var(--color-brand-light)] text-[var(--color-brand-text)]"
                      : "text-[var(--color-text-secondary)]"
                  }`}
                >
                  {org.name}
                </button>
              ))}
              {organizations.length === 0 && (
                <p className="px-3 py-2 text-sm text-[var(--color-text-muted)]">No organizations</p>
              )}
              <Link
                href="/organizations"
                onClick={() => setShowOrgDropdown(false)}
                className="block w-full text-left px-3 py-2 text-sm text-[var(--color-brand-text)] hover:bg-[var(--color-bg-hover)] border-t border-[var(--color-border-secondary)]"
              >
                Manage organizations
              </Link>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1" aria-label="Dashboard navigation">
          <NavItem href="/boards" label="Boards" icon={BoardsIcon} active={pathname === "/boards"} />
          <NavItem href="/organizations" label="Organizations" icon={OrgIcon} active={pathname === "/organizations"} />
          <NavItem href="/templates" label="Templates" icon={TemplatesIcon} active={pathname === "/templates"} />
          <NavItem href="/settings" label="Settings" icon={SettingsIcon} active={pathname === "/settings"} />
        </nav>

        {/* User section */}
        <div className="border-t border-[var(--color-border-secondary)] p-4">
          <div className="flex items-center gap-3">
            <Avatar name={user?.displayName || user?.email} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {user?.displayName || "User"}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-4 sm:px-8 shrink-0">
          {/* Hamburger (mobile) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] lg:hidden"
            aria-label="Open sidebar menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div className="flex-1 max-w-md hidden sm:block">
            <label htmlFor="global-search" className="sr-only">Search boards</label>
            <input
              id="global-search"
              type="search"
              placeholder="Search boards..."
              className="w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-4 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-focus)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
            />
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Avatar name={user?.displayName || user?.email} size="sm" />
          </div>
        </header>

        <main id="main-content" className="flex-1 overflow-auto p-4 sm:p-8" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-[var(--color-brand-light)] text-[var(--color-brand-text)]"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {label}
    </Link>
  );
}

function BoardsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function OrgIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  );
}

function TemplatesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
