"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrgStore } from "@/stores/org-store";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentBoard {
  id: string;
  name: string;
  description: string | null;
  createdByName: string | null;
  updatedAt: string;
}

interface ActivityItem {
  id: string;
  boardName: string;
  userName: string | null;
  action: "created" | "updated";
  timestamp: string;
}

interface DashboardData {
  totalBoards: number;
  totalMembers: number;
  activeBoards: number;
  recentBoards: RecentBoard[];
  recentActivity: ActivityItem[];
  activityByDay: Record<string, number>;
}

export default function DashboardPage() {
  const router = useRouter();
  const { currentOrg } = useOrgStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentOrg) return;
    setIsLoading(true);
    api.get<DashboardData>(`/api/orgs/${currentOrg.id}/dashboard`)
      .then(setData)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [currentOrg]);

  if (!currentOrg) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-medium text-[var(--color-text-primary)]">Welcome to CollabBoard</h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Create or select an organization to get started</p>
        <Button className="mt-4" onClick={() => router.push("/organizations")}>
          Go to Organizations
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-[var(--color-text-muted)]">Failed to load dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Dashboard</h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">{currentOrg.name}</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="Total Boards" value={data.totalBoards} icon={BoardIcon} color="purple" />
        <MetricCard label="Team Members" value={data.totalMembers} icon={MembersIcon} color="green" />
        <MetricCard label="Active This Week" value={data.activeBoards} icon={ActivityIcon} color="orange" />
      </div>

      {/* Activity Chart (simple bar) */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Activity (Last 7 Days)</h3>
          <ActivityChart data={data.activityByDay} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Boards */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Recent Boards</h3>
              <Button size="sm" variant="ghost" onClick={() => router.push("/boards")}>View all</Button>
            </div>
            {data.recentBoards.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] py-4 text-center">No boards yet</p>
            ) : (
              <div className="space-y-2">
                {data.recentBoards.map((board) => (
                  <button
                    key={board.id}
                    onClick={() => router.push(`/boards/${board.id}`)}
                    className="w-full text-left p-3 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
                  >
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{board.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {board.createdByName} · {formatRelativeTime(board.updatedAt)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardContent className="pt-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Recent Activity</h3>
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] py-4 text-center">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {data.recentActivity.map((item, i) => (
                  <div key={`${item.id}-${i}`} className="flex items-start gap-3">
                    <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${item.action === "created" ? "bg-green-500" : "bg-blue-500"}`} />
                    <div className="min-w-0">
                      <p className="text-sm text-[var(--color-text-primary)]">
                        <span className="font-medium">{item.userName || "Someone"}</span>
                        {" "}{item.action}{" "}
                        <button
                          onClick={() => router.push(`/boards/${item.id}`)}
                          className="font-medium text-[var(--color-brand-text)] hover:underline"
                        >
                          {item.boardName}
                        </button>
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">{formatRelativeTime(item.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.FC<{ className?: string }>; color: string }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    purple: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400" },
    green: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400" },
    orange: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-600 dark:text-orange-400" },
    pink: { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-600 dark:text-pink-400" },
  };
  const c = colorMap[color] || colorMap.purple;

  return (
    <Card>
      <CardContent className="flex items-center justify-between py-5">
        <div>
          <p className="text-3xl font-bold text-[var(--color-text-primary)]">{value}</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">{label}</p>
        </div>
        <div className={`p-3 rounded-xl ${c.bg}`}>
          <Icon className={`w-6 h-6 ${c.text}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityChart({ data }: { data: Record<string, number> }) {
  // Generate last 7 days
  const days: { label: string; key: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      label: d.toLocaleDateString("en", { weekday: "short" }),
      key: d.toISOString().split("T")[0],
    });
  }

  const maxValue = Math.max(1, ...days.map((d) => data[d.key] || 0));

  return (
    <div className="flex items-end gap-2 h-32">
      {days.map((day) => {
        const value = data[day.key] || 0;
        const height = Math.max(4, (value / maxValue) * 100);
        return (
          <div key={day.key} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-[var(--color-text-muted)]">{value || ""}</span>
            <div
              className="w-full rounded-t bg-[var(--color-brand)] opacity-90 transition-all"
              style={{ height: `${height}%` }}
            />
            <span className="text-[10px] text-[var(--color-text-muted)]">{day.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-24 mt-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}><CardContent className="py-5"><Skeleton className="h-12 w-full" /></CardContent></Card>
        ))}
      </div>
      <Card><CardContent className="pt-4"><Skeleton className="h-32 w-full" /></CardContent></Card>
    </div>
  );
}

// ═══════════════════════════════════════
// Helpers
// ═══════════════════════════════════════

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function BoardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
    </svg>
  );
}

function MembersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
    </svg>
  );
}
