"use client";

import { useEffect, type ReactNode } from "react";
import type { Session } from "next-auth";
import { I18nProvider } from "@/lib/i18n/provider";
import { ThemeProvider } from "next-themes";
import { FavoritesProvider } from "@/lib/favorites";
import { CompareProvider } from "@/lib/compare";
import { RecentlyViewedProvider } from "@/lib/recently-viewed";
import { NotificationsProvider } from "@/lib/notifications";
import { SavedSearchesProvider } from "@/lib/saved-searches";
import { OpenRouterSettingsProvider } from "@/lib/openrouter-settings";
import { AuthProvider } from "@/lib/auth-context";
import { HydrationCoordinator } from "@/lib/use-hydrated";
import { registerServiceWorker } from "@/lib/pwa";
import { OfflineIndicator } from "@/components/real-estate/offline-indicator";
import { InstallPwaBanner } from "@/components/real-estate/install-pwa-banner";
import { NotificationSync } from "@/components/real-estate/notification-sync";

export function Providers({
  children,
  session,
}: {
  children: ReactNode;
  session: Session | null;
}) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <I18nProvider>
        <AuthProvider session={session}>
          <OpenRouterSettingsProvider>
            <FavoritesProvider>
              <CompareProvider>
                <SavedSearchesProvider>
                  <RecentlyViewedProvider>
                    <NotificationsProvider>
                      {children}
                      <NotificationSync />
                      <OfflineIndicator />
                      <InstallPwaBanner />
                    </NotificationsProvider>
                  </RecentlyViewedProvider>
                </SavedSearchesProvider>
              </CompareProvider>
            </FavoritesProvider>
          </OpenRouterSettingsProvider>
        </AuthProvider>
      </I18nProvider>
      <HydrationCoordinator />
    </ThemeProvider>
  );
}
