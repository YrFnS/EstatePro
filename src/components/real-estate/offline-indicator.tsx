"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { toast } from "sonner";

function getInitialOfflineState() {
  if (typeof window === "undefined") return false;
  return !navigator.onLine;
}

export function OfflineIndicator() {
  const { t } = useI18n();
  const [isOffline, setIsOffline] = useState(getInitialOfflineState);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      toast.error(t("pwa.offlineTitle"), {
        description: t("pwa.offlineDesc"),
        duration: 5000,
        icon: <WifiOff className="h-4 w-4" />,
      });
    };

    const handleOnline = () => {
      setIsOffline(false);
      toast.success(t("pwa.onlineTitle"), {
        description: t("pwa.onlineDesc"),
        duration: 3000,
        icon: <Wifi className="h-4 w-4" />,
      });
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [t]);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-amber-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-300">
      <WifiOff className="h-3.5 w-3.5" />
      <span>{t("pwa.offlineTitle")}</span>
    </div>
  );
}
