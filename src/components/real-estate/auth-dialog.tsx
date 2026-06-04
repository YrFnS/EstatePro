"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound, UserPlus, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "login" | "register";
}

export function AuthDialog({ open, onOpenChange, defaultTab = "login" }: AuthDialogProps) {
  const { t } = useI18n();
  const { login, register } = useAuth();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");

  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const result = await login(loginEmail, loginPassword);
      if (result.success) {
        toast.success(t("auth.signIn"));
        onOpenChange(false);
        setLoginEmail("");
        setLoginPassword("");
      } else {
        setLoginError(result.error || t("auth.invalidCredentials"));
      }
    } catch {
      setLoginError(t("auth.invalidCredentials"));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");

    if (regPassword !== regConfirmPassword) {
      setRegError(t("auth.passwordMismatch"));
      return;
    }

    if (regPassword.length < 6) {
      setRegError(t("auth.passwordMinLength"));
      return;
    }

    setRegLoading(true);

    try {
      const result = await register(regName, regEmail, regPassword);
      if (result.success) {
        toast.success(t("auth.registrationSuccess"));
        onOpenChange(false);
        setRegName("");
        setRegEmail("");
        setRegPassword("");
        setRegConfirmPassword("");
      } else {
        setRegError(result.error || t("auth.emailExists"));
      }
    } catch {
      setRegError(t("auth.emailExists"));
    } finally {
      setRegLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast.info(t("auth.passwordResetComingSoon"));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Header with gold gradient */}
        <div className="relative bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-600/10 border-b border-border">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-center text-xl font-bold">
              {activeTab === "login" ? t("auth.welcomeBack") : t("auth.welcomeNew")}
            </DialogTitle>
            <p className="text-center text-sm text-muted-foreground mt-1">
              {activeTab === "login" ? t("auth.loginDesc") : t("auth.registerDesc")}
            </p>
          </DialogHeader>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")} className="w-full">
          <div className="px-6 pt-2">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="login" className="gap-1.5 text-sm">
                <KeyRound className="w-3.5 h-3.5" />
                {t("auth.login")}
              </TabsTrigger>
              <TabsTrigger value="register" className="gap-1.5 text-sm">
                <UserPlus className="w-3.5 h-3.5" />
                {t("auth.register")}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Login Tab */}
          <TabsContent value="login" className="mt-0 px-6 pb-6 pt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm font-medium">
                  {t("auth.email")}
                </Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="name@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="ps-9"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-sm font-medium">
                  {t("auth.password")}
                </Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="ps-9"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {loginError && (
                <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  {loginError}
                </div>
              )}

              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {t("auth.forgotPassword")}
              </button>

              <Button
                type="submit"
                className="w-full bg-[var(--gold)] hover:bg-[var(--gold)]/90 text-[var(--gold-foreground)] gap-2"
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  t("auth.signInButton")
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                {t("auth.noAccount")}{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("register")}
                  className="text-primary hover:underline font-medium"
                >
                  {t("auth.signUp")}
                </button>
              </p>
            </form>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register" className="mt-0 px-6 pb-6 pt-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-name" className="text-sm font-medium">
                  {t("auth.name")}
                </Label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reg-name"
                    type="text"
                    placeholder={t("auth.namePlaceholder")}
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="ps-9"
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-email" className="text-sm font-medium">
                  {t("auth.email")}
                </Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="name@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="ps-9"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-password" className="text-sm font-medium">
                  {t("auth.password")}
                </Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="ps-9"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-confirm" className="text-sm font-medium">
                  {t("auth.confirmPassword")}
                </Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reg-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="ps-9"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {regError && (
                <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  {regError}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-[var(--gold)] hover:bg-[var(--gold)]/90 text-[var(--gold-foreground)] gap-2"
                disabled={regLoading}
              >
                {regLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  t("auth.signUpButton")
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                {t("auth.hasAccount")}{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("login")}
                  className="text-primary hover:underline font-medium"
                >
                  {t("auth.signIn")}
                </button>
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
