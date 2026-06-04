"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthContextInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        avatar: session.user.avatar,
      }
    : null;

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        return { success: false, error: "Invalid email or password" };
      }

      return { success: true };
    } catch {
      return { success: false, error: "Login failed" };
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut({ redirect: false });
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed" };
      }

      // Auto-login after successful registration
      const loginResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginResult?.error) {
        return { success: true }; // Registration succeeded but auto-login failed
      }

      return { success: true };
    } catch {
      return { success: false, error: "Registration failed" };
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextInner>{children}</AuthContextInner>
    </SessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
