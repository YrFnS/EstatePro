"use client";

import { useEffect } from "react";
import { I18nProvider } from "@/lib/i18n/provider";
import { ThemeProvider } from "next-themes";
import { FavoritesProvider } from "@/lib/favorites";
import { CompareProvider } from "@/lib/compare";
import { RecentlyViewedProvider } from "@/lib/recently-viewed";
import { NotificationsProvider } from "@/lib/notifications";
import { SavedSearchesProvider } from "@/lib/saved-searches";
import { OpenRouterSettingsProvider } from "@/lib/openrouter-settings";
import { AuthProvider } from "@/lib/auth-context";
import { useHydrated } from "@/lib/use-hydrated";
import { registerServiceWorker } from "@/lib/pwa";
import { OfflineIndicator } from "@/components/real-estate/offline-indicator";
import { InstallPwaBanner } from "@/components/real-estate/install-pwa-banner";
import { NotificationSync } from "@/components/real-estate/notification-sync";

function HydrationSafeThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const hydrated = useHydrated();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      forcedTheme={hydrated ? undefined : "light"}
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <HydrationSafeThemeProvider>
      <I18nProvider>
        <AuthProvider>
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
    </HydrationSafeThemeProvider>
  );
}
