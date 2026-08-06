"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface TemplateInfo {
  id: string;
  name: string;
  description: string | null;
  category: string;
  thumbnailUrl: string | null;
}

interface Props {
  onSelect: (templateId: string | null) => void;
  onCancel: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  ideation: "bg-purple-100 text-purple-700",
  organization: "bg-blue-100 text-blue-700",
  process: "bg-green-100 text-green-700",
};

const CATEGORY_ICONS: Record<string, string> = {
  ideation: "💡",
  organization: "🏢",
  process: "⚙️",
};

export default function TemplateGallery({ onSelect, onCancel }: Props) {
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const data = await api.get<TemplateInfo[]>("/api/templates");
        setTemplates(data);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Choose a template</h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>

      {/* Blank board option */}
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow border-2 border-dashed border-gray-300 hover:border-blue-400"
        onClick={() => onSelect(null)}
      >
        <CardContent className="flex items-center gap-4 py-4">
          <div className="w-16 h-12 rounded bg-gray-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Blank Board</p>
            <p className="text-xs text-gray-500">Start from scratch</p>
          </div>
        </CardContent>
      </Card>

      {/* Template grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {templates.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer hover:shadow-md transition-shadow hover:border-blue-300"
            onClick={() => onSelect(template.id)}
          >
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-lg shrink-0">
                  {CATEGORY_ICONS[template.category] || "📋"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{template.name}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[template.category] || "bg-gray-100 text-gray-600"}`}>
                      {template.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
