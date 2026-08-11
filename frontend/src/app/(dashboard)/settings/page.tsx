"use client";

import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useThemeStore } from "@/stores/theme-store";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Settings</h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">Manage your account and preferences</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Profile */}
        <Card>
          <CardContent className="pt-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Profile</h3>
            <div className="flex items-center gap-4">
              <Avatar name={user?.displayName || user?.email} size="lg" />
              <div>
                <p className="font-medium text-[var(--color-text-primary)]">{user?.displayName || "User"}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardContent className="pt-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Appearance</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-text-primary)]">Theme</p>
                <p className="text-xs text-[var(--color-text-muted)]">Current: {theme}</p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
