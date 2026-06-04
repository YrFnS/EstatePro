"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { useRouter, type View } from "@/lib/router";
import { useTheme } from "next-themes";
import { useFavorites } from "@/lib/favorites";
import { useCompare } from "@/lib/compare";
import { useAuth } from "@/lib/auth-context";
import { Home, Globe, Sun, Moon, Menu, Heart, Scale, BookmarkPlus, Brain, DollarSign, MapPin, ChevronDown, Calculator, Compass, UserCircle, Calendar, BellRing, BarChart3, Settings, Shield, LogOut, LayoutDashboard, Route } from "lucide-react";
import { NotificationBell } from "@/components/real-estate/notification-bell";
import { AuthDialog } from "@/components/real-estate/auth-dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NavItem {
  label: string;
  view: View;
  icon?: React.ComponentType<{ className?: string }>;
}

export function Navbar() {
  const { t, locale, setLocale, dir } = useI18n();
  const { view, navigate } = useRouter();
  const { theme, setTheme } = useTheme();
  const { favoritesCount } = useFavorites();
  const { compareCount } = useCompare();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const emptySubscribe = useCallback(() => () => {}, []);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems: NavItem[] = [
    { label: t("common.home"), view: "home" },
    { label: t("common.properties"), view: "properties" },
    { label: t("common.agents"), view: "agents" },
    { label: t("common.about"), view: "about" },
    { label: t("common.contact"), view: "contact" },
  ];

  const toolItems: NavItem[] = [
    { label: t("common.calculator"), view: "calculator", icon: Calculator },
    { label: t("commute.title"), view: "commute" as View, icon: Route },
    { label: t("aiRecommend.title"), view: "ai-recommend", icon: Brain },
    { label: t("valuation.title"), view: "valuation", icon: DollarSign },
    { label: t("neighborhoodGuide.heroTitle"), view: "neighborhood-guide", icon: Compass },
    { label: t("alerts.title"), view: "property-alerts", icon: BellRing },
    { label: t("marketInsights.title"), view: "market-insights", icon: BarChart3 },
    { label: t("admin.title"), view: "admin" as View, icon: Shield },
  ];

  const isToolsActive = toolItems.some(item => item.view === view);

  const toggleLocale = () => {
    setLocale(locale === "en" ? "ar" : "en");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleNavClick = (navView: View) => {
    navigate(navView);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    toast.success(t("auth.signOutSuccess"));
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/80 shadow-sm"
          : "bg-background border-b border-border"
      )}>
        <div
          className={cn(
            "mx-auto max-w-7xl h-16",
            "flex items-center justify-between px-4 sm:px-6",
            "transition-all duration-300"
          )}
        >
          {/* Logo */}
          <button
            onClick={() => handleNavClick("home")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
          >
            <Home className="w-5 h-5 text-[var(--gold)]" />
            <span className="text-lg font-semibold tracking-tight text-foreground">
              {t("common.appName")}
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => handleNavClick(item.view)}
                className={cn(
                  "relative py-1 text-sm font-medium transition-colors duration-200",
                  view === item.view
                    ? "text-foreground"
                    : "text-foreground/60 hover:text-foreground"
                )}
              >
                {item.label}
                {/* Animated underline on active */}
                <span
                  className={cn(
                    "absolute bottom-0 start-0 end-0 h-0.5 bg-[var(--gold)] rounded-full transition-all duration-300 origin-center",
                    view === item.view
                      ? "scale-x-100 opacity-100"
                      : "scale-x-0 opacity-0"
                  )}
                />
              </button>
            ))}

            {/* Tools Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "relative py-1 text-sm font-medium transition-colors duration-200 flex items-center gap-1",
                    isToolsActive
                      ? "text-foreground"
                      : "text-foreground/60 hover:text-foreground"
                  )}
                >
                  {t("common.tools")}
                  <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200" />
                  <span
                    className={cn(
                      "absolute bottom-0 start-0 end-0 h-0.5 bg-[var(--gold)] rounded-full transition-all duration-300 origin-center",
                      isToolsActive
                        ? "scale-x-100 opacity-100"
                        : "scale-x-0 opacity-0"
                    )}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {toolItems.map((item) => (
                  <DropdownMenuItem
                    key={item.view}
                    onClick={() => handleNavClick(item.view)}
                    className={cn(
                      "cursor-pointer gap-2",
                      view === item.view && "text-[var(--gold)]"
                    )}
                  >
                    {item.icon && <item.icon className="w-4 h-4" />}
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Favorites */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleNavClick("favorites")}
              className="relative h-9 w-9"
              title={t("common.favorites")}
            >
              <Heart className={cn("h-4 w-4", view === "favorites" && "fill-current text-red-500")} />
              {favoritesCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 flex items-center justify-center min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] font-bold px-0.5">
                  {favoritesCount > 9 ? "9+" : favoritesCount}
                </span>
              )}
            </Button>

            {/* Compare */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleNavClick("compare")}
              className="relative h-9 w-9"
              title={t("common.compare")}
            >
              <Scale className="h-4 w-4" />
              {compareCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 flex items-center justify-center min-w-[16px] h-4 rounded-full bg-[var(--gold)] text-[var(--gold-foreground)] text-[10px] font-bold px-0.5">
                  {compareCount}
                </span>
              )}
            </Button>

            {/* Notifications */}
            <NotificationBell />

            {/* Divider */}
            <div className="w-px h-5 bg-border mx-1" />

            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLocale}
              className="gap-1.5 text-xs font-medium h-8 px-2"
              title={locale === "en" ? t("common.arabic") : t("common.english")}
            >
              <Globe className="h-3.5 w-3.5" />
              {locale === "en" ? "AR" : "EN"}
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
              title={mounted ? (theme === "dark" ? t("common.lightMode") : t("common.darkMode")) : ""}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">
                {mounted ? (theme === "dark" ? t("common.lightMode") : t("common.darkMode")) : ""}
              </span>
            </Button>

            {/* Auth Button */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 h-9 px-2">
                    <Avatar className="h-7 w-7">
                      {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                      <AvatarFallback className="text-xs bg-[var(--gold)] text-[var(--gold-foreground)]">
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium max-w-[80px] truncate hidden xl:inline">
                      {user.name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleNavClick("dashboard")}
                    className="cursor-pointer gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {t("dashboard.title")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleNavClick("settings")}
                    className="cursor-pointer gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    {t("settings.title")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    {t("auth.signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAuthDialogOpen(true)}
                className="gap-1.5 text-sm font-medium h-9 px-3"
              >
                <UserCircle className="h-4 w-4" />
                {t("auth.signIn")}
              </Button>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex lg:hidden items-center gap-0.5">
            {/* Favorites */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 relative"
              onClick={() => handleNavClick("favorites")}
            >
              <Heart className={cn("h-4 w-4", view === "favorites" && "fill-current text-red-500")} />
              {favoritesCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 flex items-center justify-center min-w-[14px] h-3.5 rounded-full bg-red-500 text-white text-[9px] font-bold px-0.5">
                  {favoritesCount > 9 ? "9+" : favoritesCount}
                </span>
              )}
            </Button>

            {/* Compare */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 relative"
              onClick={() => handleNavClick("compare")}
            >
              <Scale className="h-4 w-4" />
              {compareCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 flex items-center justify-center min-w-[14px] h-3.5 rounded-full bg-[var(--gold)] text-[var(--gold-foreground)] text-[9px] font-bold px-0.5">
                  {compareCount}
                </span>
              )}
            </Button>

            {/* Notifications */}
            <NotificationBell />

            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side={dir === "rtl" ? "right" : "left"} className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-[var(--gold)]" />
                    {t("common.appName")}
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-0.5 mt-4">
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.view}>
                      <button
                        onClick={() => handleNavClick(item.view)}
                        className={cn(
                          "w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-start",
                          view === item.view
                            ? "text-[var(--gold)] bg-[var(--gold)]/5"
                            : "text-foreground/60 hover:text-foreground hover:bg-accent/50"
                        )}
                      >
                        {item.label}
                      </button>
                    </SheetClose>
                  ))}

                  {/* Tools section */}
                  <div className="pt-3 mt-3 border-t">
                    <div className="px-4 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                      {t("common.tools")}
                    </div>
                    {toolItems.map((item) => (
                      <SheetClose asChild key={item.view}>
                        <button
                          onClick={() => handleNavClick(item.view)}
                          className={cn(
                            "w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-start flex items-center gap-3",
                            view === item.view
                              ? "text-[var(--gold)] bg-[var(--gold)]/5"
                              : "text-foreground/60 hover:text-foreground hover:bg-accent/50"
                          )}
                        >
                          {item.icon && <item.icon className="w-4 h-4" />}
                          {item.label}
                        </button>
                      </SheetClose>
                    ))}
                  </div>

                  {/* Account section - items moved from navbar action bar */}
                  <div className="pt-3 mt-3 border-t">
                    <div className="px-4 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                      {t("dashboard.title")}
                    </div>
                    {/* Dashboard */}
                    <SheetClose asChild>
                      <button
                        onClick={() => handleNavClick("dashboard")}
                        className={cn(
                          "w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-start flex items-center gap-3",
                          view === "dashboard"
                            ? "text-[var(--gold)] bg-[var(--gold)]/5"
                            : "text-foreground/60 hover:text-foreground hover:bg-accent/50"
                        )}
                      >
                        <UserCircle className="w-4 h-4" />
                        {t("dashboard.title")}
                      </button>
                    </SheetClose>
                    {/* Saved Searches */}
                    <SheetClose asChild>
                      <button
                        onClick={() => handleNavClick("saved-searches")}
                        className={cn(
                          "w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-start flex items-center gap-3",
                          view === "saved-searches"
                            ? "text-[var(--gold)] bg-[var(--gold)]/5"
                            : "text-foreground/60 hover:text-foreground hover:bg-accent/50"
                        )}
                      >
                        <BookmarkPlus className="w-4 h-4" />
                        {t("savedSearch.title")}
                      </button>
                    </SheetClose>
                    {/* My Tours */}
                    <SheetClose asChild>
                      <button
                        onClick={() => handleNavClick("my-tours")}
                        className={cn(
                          "w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-start flex items-center gap-3",
                          view === "my-tours"
                            ? "text-[var(--gold)] bg-[var(--gold)]/5"
                            : "text-foreground/60 hover:text-foreground hover:bg-accent/50"
                        )}
                      >
                        <Calendar className="w-4 h-4" />
                        {t("tour.title")}
                      </button>
                    </SheetClose>
                    {/* Market Insights */}
                    <SheetClose asChild>
                      <button
                        onClick={() => handleNavClick("market-insights")}
                        className={cn(
                          "w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-start flex items-center gap-3",
                          view === "market-insights"
                            ? "text-[var(--gold)] bg-[var(--gold)]/5"
                            : "text-foreground/60 hover:text-foreground hover:bg-accent/50"
                        )}
                      >
                        <BarChart3 className="w-4 h-4" />
                        {t("marketInsights.title")}
                      </button>
                    </SheetClose>
                    {/* Settings */}
                    <SheetClose asChild>
                      <button
                        onClick={() => handleNavClick("settings")}
                        className={cn(
                          "w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-start flex items-center gap-3",
                          view === "settings"
                            ? "text-[var(--gold)] bg-[var(--gold)]/5"
                            : "text-foreground/60 hover:text-foreground hover:bg-accent/50"
                        )}
                      >
                        <Settings className="w-4 h-4" />
                        {t("settings.title")}
                      </button>
                    </SheetClose>

                    {/* Sign In / Sign Out */}
                    {isAuthenticated && user ? (
                      <>
                        <div className="px-4 py-2.5 flex items-center gap-3">
                          <Avatar className="h-6 w-6">
                            {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                            <AvatarFallback className="text-[10px] bg-[var(--gold)] text-[var(--gold-foreground)]">
                              {getUserInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium truncate">{user.name}</span>
                        </div>
                        <SheetClose asChild>
                          <button
                            onClick={() => {
                              handleLogout();
                              setMobileOpen(false);
                            }}
                            className="w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-start flex items-center gap-3 text-destructive hover:bg-destructive/10"
                          >
                            <LogOut className="w-4 h-4" />
                            {t("auth.signOut")}
                          </button>
                        </SheetClose>
                      </>
                    ) : (
                      <SheetClose asChild>
                        <button
                          onClick={() => {
                            setMobileOpen(false);
                            setAuthDialogOpen(true);
                          }}
                          className="w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-start flex items-center gap-3 text-[var(--gold)] hover:bg-[var(--gold)]/5"
                        >
                          <UserCircle className="w-4 h-4" />
                          {t("auth.signIn")}
                        </button>
                      </SheetClose>
                    )}
                  </div>

                  {/* Mobile toggles */}
                  <div className="pt-3 mt-3 border-t flex items-center gap-2 px-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleLocale}
                      className="gap-1.5 text-xs font-medium h-8 flex-1"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      {locale === "en" ? "العربية" : "English"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleTheme}
                      className="gap-1.5 text-xs font-medium h-8 flex-1"
                    >
                      {mounted && theme === "dark" ? (
                        <>
                          <Sun className="h-3.5 w-3.5" />
                          {t("common.lightMode")}
                        </>
                      ) : (
                        <>
                          <Moon className="h-3.5 w-3.5" />
                          {t("common.darkMode")}
                        </>
                      )}
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Auth Dialog */}
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </>
  );
}
