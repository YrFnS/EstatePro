"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ComponentType,
} from "react";
import {
  BarChart3,
  Brain,
  Building2,
  Calendar,
  Calculator,
  ChevronDown,
  ClipboardList,
  DollarSign,
  Globe,
  Heart,
  Home,
  Key,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Plus,
  Route,
  Scale,
  Settings,
  Shield,
  Sun,
  UserCircle,
  Users,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useCompare } from "@/lib/compare";
import { useFavorites } from "@/lib/favorites";
import { useI18n } from "@/lib/i18n/provider";
import { useRouter, type View } from "@/lib/router";
import { cn } from "@/lib/utils";
import { AuthDialog } from "@/components/real-estate/auth-dialog";
import { NotificationBell } from "@/components/real-estate/notification-bell";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavigationItem {
  label: string;
  view: View;
  icon: ComponentType<{ className?: string }>;
  params?: Record<string, string>;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Navbar() {
  const { t, locale, setLocale, dir } = useI18n();
  const { view, params, navigate } = useRouter();
  const { theme, setTheme } = useTheme();
  const { favoritesCount } = useFavorites();
  const { compareCount } = useCompare();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const subscribe = useCallback(() => () => {}, []);
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const mainNavigation = useMemo<NavigationItem[]>(
    () => [
      { label: t("common.home"), view: "home", icon: Home },
      {
        label: t("common.forSale"),
        view: "properties",
        icon: Building2,
        params: { status: "sale" },
      },
      {
        label: t("common.forRent"),
        view: "properties",
        icon: Key,
        params: { status: "rent" },
      },
      { label: t("common.agents"), view: "agents", icon: Users },
      {
        label: t("marketInsights.title"),
        view: "market-insights",
        icon: BarChart3,
      },
    ],
    [t]
  );

  const tools = useMemo<NavigationItem[]>(
    () => [
      {
        label: t("common.calculator"),
        view: "calculator",
        icon: Calculator,
      },
      { label: t("commute.title"), view: "commute", icon: Route },
      {
        label: t("aiRecommend.title"),
        view: "ai-recommend",
        icon: Brain,
      },
      {
        label: t("valuation.title"),
        view: "valuation",
        icon: DollarSign,
      },
    ],
    [t]
  );

  const isActive = (item: NavigationItem) => {
    if (view !== item.view) return false;
    if (!item.params) return true;
    return Object.entries(item.params).every(
      ([key, value]) => params[key] === value
    );
  };

  const go = (item: NavigationItem) => {
    navigate(item.view, item.params);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    toast.success(t("auth.signOutSuccess"));
  };

  const accountItems: NavigationItem[] = [
    {
      label: t("dashboard.title"),
      view: "dashboard",
      icon: LayoutDashboard,
    },
    {
      label: locale === "ar" ? "إعلاناتي" : "My Listings",
      view: "my-listings",
      icon: ClipboardList,
    },
    {
      label: t("messaging.title"),
      view: "messaging",
      icon: MessageCircle,
    },
    { label: t("tour.title"), view: "my-tours", icon: Calendar },
    { label: t("settings.title"), view: "settings", icon: Settings },
  ];

  if (user?.role === "admin") {
    accountItems.push({
      label: t("admin.title"),
      view: "admin",
      icon: Shield,
    });
  }

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b transition-colors",
          scrolled
            ? "border-border/70 bg-background/90 shadow-sm backdrop-blur-xl"
            : "border-border bg-background"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate("home")}
            className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={t("common.home")}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Home className="h-4 w-4" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              {t("common.appName")}
            </span>
          </button>

          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Primary navigation"
          >
            {mainNavigation.map((item) => (
              <button
                type="button"
                key={`${item.view}-${item.params?.status || ""}`}
                onClick={() => go(item)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "gap-1 px-3 text-muted-foreground",
                    tools.some(isActive) && "bg-primary/10 text-primary"
                  )}
                >
                  {t("common.tools")}
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {tools.map((item) => (
                  <DropdownMenuItem
                    key={item.view}
                    onClick={() => go(item)}
                    className="gap-2"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="hidden items-center gap-1 lg:flex">
            {isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                className="me-1 gap-2"
                onClick={() => navigate("list-property")}
              >
                <Plus className="h-4 w-4" />
                {locale === "ar" ? "أضف عقاراً" : "List property"}
              </Button>
            ) : null}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("favorites")}
              className="relative"
              aria-label={t("common.favorites")}
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  view === "favorites" && "fill-red-500 text-red-500"
                )}
              />
              {favoritesCount > 0 ? (
                <Badge className="absolute -end-1 -top-1 h-4 min-w-4 justify-center rounded-full px-1 text-[9px]">
                  {favoritesCount > 9 ? "9+" : favoritesCount}
                </Badge>
              ) : null}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("compare")}
              className="relative"
              aria-label={t("common.compare")}
            >
              <Scale
                className={cn(
                  "h-4 w-4",
                  view === "compare" && "text-primary"
                )}
              />
              {compareCount > 0 ? (
                <Badge className="absolute -end-1 -top-1 h-4 min-w-4 justify-center rounded-full px-1 text-[9px]">
                  {compareCount}
                </Badge>
              ) : null}
            </Button>
            <NotificationBell />

            <div className="mx-1 h-5 w-px bg-border" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocale(locale === "en" ? "ar" : "en")}
              className="gap-1.5"
              aria-label={
                locale === "en"
                  ? t("common.arabic")
                  : t("common.english")
              }
            >
              <Globe className="h-4 w-4" />
              {locale === "en" ? "AR" : "EN"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setTheme(theme === "dark" ? "light" : "dark")
              }
              aria-label={
                mounted && theme === "dark"
                  ? t("common.lightMode")
                  : t("common.darkMode")
              }
            >
              <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            </Button>

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="ms-1 gap-2 px-2">
                    <Avatar className="h-8 w-8">
                      {user.avatar ? (
                        <AvatarImage src={user.avatar} alt={user.name} />
                      ) : null}
                      <AvatarFallback>{initials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-28 truncate text-sm xl:block">
                      {user.name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>
                    <p className="truncate">{user.name}</p>
                    <p className="truncate text-xs font-normal text-muted-foreground">
                      {user.email}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {accountItems.map((item) => (
                    <DropdownMenuItem
                      key={item.view}
                      onClick={() => go(item)}
                      className="gap-2"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("auth.signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => setAuthDialogOpen(true)}
                className="ms-1 gap-2"
              >
                <UserCircle className="h-4 w-4" />
                {t("auth.signIn")}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-0.5 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("favorites")}
              className="relative"
              aria-label={t("common.favorites")}
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  view === "favorites" && "fill-red-500 text-red-500"
                )}
              />
              {favoritesCount > 0 ? (
                <Badge className="absolute -end-0.5 -top-0.5 h-4 min-w-4 justify-center rounded-full px-1 text-[9px]">
                  {favoritesCount > 9 ? "9+" : favoritesCount}
                </Badge>
              ) : null}
            </Button>
            <NotificationBell />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side={dir === "rtl" ? "right" : "left"}
                className="w-[88vw] max-w-sm overflow-y-auto"
              >
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Home className="h-4 w-4" />
                    </span>
                    {t("common.appName")}
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Browse EstatePro navigation, account, and language options.
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  <nav
                    className="space-y-1"
                    aria-label="Mobile navigation"
                  >
                    {mainNavigation.map((item) => (
                      <SheetClose
                        asChild
                        key={`${item.view}-${item.params?.status || ""}`}
                      >
                        <button
                          type="button"
                          onClick={() => go(item)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start text-sm font-medium",
                            isActive(item)
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </button>
                      </SheetClose>
                    ))}
                    <SheetClose asChild>
                      <button
                        type="button"
                        onClick={() => navigate("list-property")}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start text-sm font-medium text-primary hover:bg-primary/10"
                      >
                        <Plus className="h-4 w-4" />
                        {locale === "ar" ? "أضف عقاراً" : "List a property"}
                      </button>
                    </SheetClose>
                  </nav>

                  <div className="border-t pt-5">
                    <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("common.tools")}
                    </p>
                    <div className="space-y-1">
                      {tools.map((item) => (
                        <SheetClose asChild key={item.view}>
                          <button
                            type="button"
                            onClick={() => go(item)}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start text-sm hover:bg-muted"
                          >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </button>
                        </SheetClose>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-5">
                    <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {isAuthenticated
                        ? t("dashboard.title")
                        : t("auth.signIn")}
                    </p>
                    {isAuthenticated && user ? (
                      <>
                        <div className="mb-2 flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                          <Avatar className="h-9 w-9">
                            {user.avatar ? (
                              <AvatarImage
                                src={user.avatar}
                                alt={user.name}
                              />
                            ) : null}
                            <AvatarFallback>
                              {initials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {user.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        {accountItems.map((item) => (
                          <SheetClose asChild key={item.view}>
                            <button
                              type="button"
                              onClick={() => go(item)}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start text-sm hover:bg-muted"
                            >
                              <item.icon className="h-4 w-4" />
                              {item.label}
                            </button>
                          </SheetClose>
                        ))}
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start text-sm text-destructive hover:bg-destructive/10"
                        >
                          <LogOut className="h-4 w-4" />
                          {t("auth.signOut")}
                        </button>
                      </>
                    ) : (
                      <Button
                        className="w-full gap-2"
                        onClick={() => {
                          setMobileOpen(false);
                          setAuthDialogOpen(true);
                        }}
                      >
                        <UserCircle className="h-4 w-4" />
                        {t("auth.signIn")}
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t pt-5">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setLocale(locale === "en" ? "ar" : "en")
                      }
                      className="gap-2"
                    >
                      <Globe className="h-4 w-4" />
                      {locale === "en" ? "العربية" : "English"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setTheme(theme === "dark" ? "light" : "dark")
                      }
                      className="gap-2"
                    >
                      {mounted && theme === "dark" ? (
                        <Sun className="h-4 w-4" />
                      ) : (
                        <Moon className="h-4 w-4" />
                      )}
                      {mounted && theme === "dark"
                        ? t("common.lightMode")
                        : t("common.darkMode")}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
      />
    </>
  );
}
