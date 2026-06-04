"use client";

import { useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { useNotifications, type NotificationType } from "@/lib/notifications";
import { Bell, Home, TrendingDown, Search, MessageCircle, Check, Trash2, ExternalLink, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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

function getFullDate(timestamp: number, locale: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type FilterTab = "all" | "unread" | "property" | "price" | "search" | "system" | "inquiry";

export function NotificationsPage() {
  const { t, locale } = useI18n();
  const { navigate } = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case "unread":
        return notifications.filter((n) => !n.read);
      case "property":
      case "price":
      case "search":
      case "system":
      case "inquiry":
        return notifications.filter((n) => n.type === activeTab);
      default:
        return notifications;
    }
  }, [notifications, activeTab]);

  const handleNotificationClick = (notification: { id: string; read: boolean; actionUrl?: string }) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl as "home" | "properties" | "saved-searches" | "agents");
    }
  };

  const tabs: { value: FilterTab; label: string; count?: number }[] = [
    { value: "all", label: t("notifications.filterAll"), count: notifications.length },
    { value: "unread", label: t("notifications.filterUnread"), count: unreadCount },
    { value: "property", label: t("notifications.filterProperty") },
    { value: "price", label: t("notifications.filterPrice") },
    { value: "search", label: t("notifications.filterSearch") },
    { value: "system", label: t("notifications.filterSystem") },
    { value: "inquiry", label: t("notifications.filterInquiry") },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold">{t("notifications.title")}</h1>
                {unreadCount > 0 && (
                  <Badge className="bg-primary/10 text-primary border-0">
                    {t("notifications.unread")} {unreadCount}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                {notifications.length} {notifications.length === 1 ? "notification" : "notifications"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="gap-1.5 text-xs"
                >
                  <Check className="h-3.5 w-3.5" />
                  {t("notifications.markAllRead")}
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                  className="gap-1.5 text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("notifications.clearAll")}
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
            <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="ms-1 text-[10px] opacity-70">({tab.count})</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Single TabsContent for all filters */}
            <TabsContent value={activeTab} className="mt-4">
              {filteredNotifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16"
                >
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <BellOff className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-muted-foreground mb-1">
                    {t("notifications.noNotifications")}
                  </h3>
                  <p className="text-sm text-muted-foreground/70">
                    {activeTab === "all"
                      ? t("notifications.noNotifications")
                      : t("notifications.noNotifications")}
                  </p>
                </motion.div>
              ) : (
                <div className="flex flex-col gap-3">
                  <AnimatePresence mode="popLayout">
                    {filteredNotifications.map((notification, index) => {
                      const Icon = getNotificationIcon(notification.type);
                      const iconBg = getNotificationIconBg(notification.type);

                      return (
                        <motion.div
                          key={notification.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <Card
                            className={cn(
                              "group transition-all hover:shadow-md cursor-pointer",
                              !notification.read && "border-primary/20 bg-primary/5"
                            )}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className={cn("flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center", iconBg)}>
                                  <Icon className="h-5 w-5" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <p className={cn(
                                        "text-sm",
                                        !notification.read ? "font-semibold" : "font-medium text-muted-foreground"
                                      )}>
                                        {notification.title}
                                      </p>
                                      {!notification.read && (
                                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
                                      )}
                                    </div>
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0">
                                      {t(`notifications.${notification.type}`)}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-muted-foreground">
                                      {getFullDate(notification.timestamp, locale)}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      {notification.actionUrl && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 text-xs text-primary hover:text-primary dark:hover:text-primary/80 gap-1"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleNotificationClick(notification);
                                          }}
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                          {t("notifications.viewAll")}
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteNotification(notification.id);
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                        {t("notifications.deleteNotif")}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
