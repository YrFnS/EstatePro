"use client";

import { useEffect } from "react";
import { I18nProvider } from "@/lib/i18n/provider";
import { ThemeProvider } from "next-themes";
import { FavoritesProvider } from "@/lib/favorites";
import { CompareProvider } from "@/lib/compare";
import { RecentlyViewedProvider } from "@/lib/recently-viewed";
import { NotificationsProvider } from "@/lib/notifications";
import { OpenRouterSettingsProvider } from "@/lib/openrouter-settings";
import { AuthProvider } from "@/lib/auth-context";
import { registerServiceWorker } from "@/lib/pwa";
import { OfflineIndicator } from "@/components/real-estate/offline-indicator";
import { InstallPwaBanner } from "@/components/real-estate/install-pwa-banner";

export function Providers({ children }: { children: React.ReactNode }) {
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
        <AuthProvider>
          <OpenRouterSettingsProvider>
            <FavoritesProvider>
              <CompareProvider>
                <RecentlyViewedProvider>
                  <NotificationsProvider>
                    {children}
                    <OfflineIndicator />
                    <InstallPwaBanner />
                  </NotificationsProvider>
                </RecentlyViewedProvider>
              </CompareProvider>
            </FavoritesProvider>
          </OpenRouterSettingsProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
