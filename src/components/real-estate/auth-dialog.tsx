"use client";

import { useEffect, useState } from "react";
import {
  KeyRound,
  Loader2,
  Lock,
  Mail,
  User,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "login" | "register";
}

export function AuthDialog({
  open,
  onOpenChange,
  defaultTab = "login",
}: AuthDialogProps) {
  const { t, locale } = useI18n();
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  useEffect(() => {
    if (open) setActiveTab(defaultTab);
  }, [defaultTab, open]);

  const closeAndReset = () => {
    onOpenChange(false);
    setLoginEmail("");
    setLoginPassword("");
    setLoginError("");
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setRegisterError("");
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const result = await login(loginEmail.trim().toLowerCase(), loginPassword);
      if (!result.success) {
        setLoginError(result.error || t("auth.invalidCredentials"));
        return;
      }
      toast.success(t("auth.signInSuccess"));
      closeAndReset();
    } catch {
      setLoginError(t("auth.invalidCredentials"));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setRegisterError("");

    if (name.trim().length < 2) {
      setRegisterError(
        locale === "ar" ? "أدخل اسماً صالحاً" : "Enter a valid name"
      );
      return;
    }
    if (password.length < 8) {
      setRegisterError(
        locale === "ar"
          ? "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل"
          : "Password must be at least 8 characters"
      );
      return;
    }
    if (password !== confirmPassword) {
      setRegisterError(t("auth.passwordMismatch"));
      return;
    }

    setRegisterLoading(true);
    try {
      const result = await register(
        name.trim(),
        email.trim().toLowerCase(),
        password
      );
      if (!result.success) {
        setRegisterError(result.error || t("auth.emailExists"));
        return;
      }
      toast.success(t("auth.registrationSuccess"));
      closeAndReset();
    } catch {
      setRegisterError(t("auth.emailExists"));
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-md">
        <div className="border-b bg-gradient-to-br from-primary/10 via-background to-primary/5 px-6 py-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            {activeTab === "login" ? (
              <KeyRound className="h-5 w-5" />
            ) : (
              <UserPlus className="h-5 w-5" />
            )}
          </div>
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {activeTab === "login"
                ? t("auth.welcomeBack")
                : t("auth.welcomeNew")}
            </DialogTitle>
            <p className="text-center text-sm text-muted-foreground">
              {activeTab === "login" ? t("auth.loginDesc") : t("auth.registerDesc")}
            </p>
          </DialogHeader>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value === "register" ? "register" : "login")
          }
        >
          <div className="px-6 pt-5">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="gap-2">
                <KeyRound className="h-4 w-4" />
                {t("auth.login")}
              </TabsTrigger>
              <TabsTrigger value="register" className="gap-2">
                <UserPlus className="h-4 w-4" />
                {t("auth.register")}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="login" className="m-0 px-6 pb-6 pt-5">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">{t("auth.email")}</Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    className="ps-9"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">{t("auth.password")}</Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    className="ps-9"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>
              {loginError ? (
                <div className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {loginError}
                </div>
              ) : null}
              <Button className="w-full gap-2" disabled={loginLoading}>
                {loginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t("auth.signInButton")}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {t("auth.noAccount")}{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("register")}
                  className="font-medium text-primary hover:underline"
                >
                  {t("auth.signUp")}
                </button>
              </p>
            </form>
          </TabsContent>

          <TabsContent value="register" className="m-0 px-6 pb-6 pt-5">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">{t("auth.name")}</Label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="register-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="ps-9"
                    autoComplete="name"
                    minLength={2}
                    maxLength={120}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">{t("auth.email")}</Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="ps-9"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="register-password">{t("auth.password")}</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm">{t("auth.confirmPassword")}</Label>
                  <Input
                    id="register-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                  />
                </div>
              </div>
              {registerError ? (
                <div className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {registerError}
                </div>
              ) : null}
              <Button className="w-full gap-2" disabled={registerLoading}>
                {registerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t("auth.signUpButton")}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {t("auth.hasAccount")}{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("login")}
                  className="font-medium text-primary hover:underline"
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
