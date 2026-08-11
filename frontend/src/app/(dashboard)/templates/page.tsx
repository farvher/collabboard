"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrgStore } from "@/stores/org-store";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  thumbnailUrl: string | null;
}

export default function TemplatesPage() {
  const router = useRouter();
  const { currentOrg } = useOrgStore();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = currentOrg ? `?orgId=${currentOrg.id}` : "";
    api.get<Template[]>(`/api/templates${params}`)
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [currentOrg]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Templates</h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">Start a new board from a template</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-[var(--color-text-muted)]">No templates available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <Card key={t.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <div className="h-28 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-t-xl flex items-center justify-center">
                <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">{t.category}</span>
              </div>
              <CardContent className="pt-3">
                <h3 className="font-semibold text-[var(--color-text-primary)]">{t.name}</h3>
                {t.description && (
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1 line-clamp-2">{t.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
