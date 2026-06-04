"use client";

import { useI18n } from "@/lib/i18n/provider";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { dir } = useI18n();

  return (
    <div
      dir={dir}
      className="min-h-screen flex flex-col font-sans"
      suppressHydrationWarning
    >
      {children}
    </div>
  );
}
