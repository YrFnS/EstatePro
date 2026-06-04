"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("EstatePro Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -end-40 w-80 h-80 rounded-full bg-destructive/5 blur-3xl" />
        <div className="absolute -bottom-40 -start-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <Card className="relative z-10 max-w-lg w-full border-destructive/20 shadow-lg">
        <CardContent className="p-8 text-center">
          {/* Error Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>

          {/* Error Title */}
          <h2 className="text-2xl font-bold mb-2">Something Went Wrong</h2>

          {/* Error Description */}
          <p className="text-muted-foreground mb-2">
            We encountered an unexpected error while loading this page.
          </p>

          {/* Error Message */}
          {error.message && (
            <div className="mb-6 rounded-lg bg-muted p-3 text-left">
              <p className="text-sm font-mono text-destructive break-words">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground mt-1">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <Button
              onClick={reset}
              className="gap-2 min-w-[140px]"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/")}
              className="gap-2 min-w-[140px]"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
