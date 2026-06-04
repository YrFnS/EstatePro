"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPwaBanner() {
  const { t } = useI18n();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if dismissed this session
    const dismissed = localStorage.getItem("estatepro-install-dismissed");
    if (dismissed === "true") return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      toast.success(t("pwa.installed"));
    }

    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("estatepro-install-dismissed", "true");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-80 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="rounded-xl border border-border bg-card p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D4A853]/10">
            <Download className="h-5 w-5 text-[#D4A853]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-card-foreground">
              {t("pwa.installTitle")}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("pwa.installDesc")}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleInstall}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#D4A853] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#C49A48] transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                {t("pwa.installButton")}
              </button>
              <button
                onClick={handleDismiss}
                className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-card-foreground hover:bg-muted transition-colors"
              >
                {t("pwa.dismissButton")}
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-card-foreground hover:bg-muted transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
