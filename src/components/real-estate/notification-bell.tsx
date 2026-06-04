"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { useNotifications, type NotificationType } from "@/lib/notifications";
import { Bell, Home, TrendingDown, Search, MessageCircle, Check, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

function getRelativeTime(timestamp: number, t: (key: string) => string): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return t("notifications.justNow");
  if (minutes < 60) return t("notifications.minutesAgo").replace("{count}", String(minutes));
  if (hours < 24) return t("notifications.hoursAgo").replace("{count}", String(hours));
  return t("notifications.daysAgo").replace("{count}", String(days));
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "property":
      return Home;
    case "price":
      return TrendingDown;
    case "search":
      return Search;
    case "inquiry":
      return MessageCircle;
    case "system":
    default:
      return Bell;
  }
}

function getNotificationIconBg(type: NotificationType) {
  switch (type) {
    case "property":
      return "bg-primary/10 text-primary";
    case "price":
      return "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400";
    case "search":
      return "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400";
    case "inquiry":
      return "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400";
    case "system":
    default:
      return "bg-primary/10 text-primary";
  }
}

export function NotificationBell() {
  const { t } = useI18n();
  const { navigate } = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleNotificationClick = (notification: { id: string; read: boolean; actionUrl?: string }) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl as "home" | "properties" | "saved-searches" | "agents");
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          title={t("notifications.title")}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -end-1 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-primary-foreground text-[10px] font-bold px-1"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 sm:w-96 p-0 gap-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">{t("notifications.title")}</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-primary/10 text-primary">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={markAllAsRead}
              >
                <Check className="h-3 w-3 me-1" />
                {t("notifications.markAllRead")}
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-destructive"
                onClick={clearAll}
              >
                <Trash2 className="h-3 w-3 me-1" />
                {t("notifications.clearAll")}
              </Button>
            )}
          </div>
        </div>

        {/* Notification List */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{t("notifications.noNotifications")}</p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="flex flex-col">
              <AnimatePresence>
                {notifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  const iconBg = getNotificationIconBg(notification.type);

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 border-b last:border-b-0 cursor-pointer transition-colors hover:bg-accent/50",
                        !notification.read && "bg-primary/5"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {/* Icon */}
                      <div className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5", iconBg)}>
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            "text-sm leading-tight",
                            !notification.read ? "font-semibold" : "font-medium text-muted-foreground"
                          )}>
                            {notification.title}
                          </p>
                          {/* Unread dot */}
                          {!notification.read && (
                            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground">
                            {getRelativeTime(notification.timestamp, t)}
                          </span>
                          {notification.actionUrl && (
                            <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}

        {/* Footer - View All */}
        {notifications.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-primary hover:text-primary dark:hover:text-primary/80"
              onClick={() => {
                navigate("notifications");
                setOpen(false);
              }}
            >
              {t("notifications.viewAll")}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
