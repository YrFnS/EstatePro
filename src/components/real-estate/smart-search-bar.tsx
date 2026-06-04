"use client";

import { useState, useRef, useCallback } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { useOpenRouterSettings } from "@/lib/openrouter-settings";
import { Sparkles, Search, Loader2, Wand2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SmartSearchParams {
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: string;
  bathrooms?: string;
  location?: string;
  status?: string;
  minArea?: number;
  maxArea?: number;
}

interface SmartSearchBarProps {
  /** Optional className for the outer container */
  className?: string;
  /** Whether this is rendered over a dark background (hero section) */
  darkBackground?: boolean;
  /** Placeholder text override */
  placeholder?: string;
}

export function SmartSearchBar({
  className = "",
  darkBackground = false,
  placeholder,
}: SmartSearchBarProps) {
  const { t } = useI18n();
  const { navigate } = useRouter();
  const { settings } = useOpenRouterSettings();

  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRegularSearch = useCallback(() => {
    if (!query.trim()) return;
    navigate("properties", { search: query.trim() });
  }, [query, navigate]);

  const handleSmartSearch = useCallback(async () => {
    if (!query.trim()) return;

    if (!settings.isConfigured) {
      // Fallback to regular search if AI not configured
      navigate("properties", { search: query.trim() });
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch("/api/smart-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-openrouter-key": settings.apiKey,
          "x-openrouter-model": settings.model,
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If AI fails, fall back to regular search
        navigate("properties", { search: query.trim() });
        return;
      }

      const params: SmartSearchParams = data.params || {};

      // Convert smart search params to URL query params matching properties page API
      const urlParams: Record<string, string> = {};

      if (params.location) {
        urlParams.search = params.location;
      }
      if (params.propertyType) {
        urlParams.type = params.propertyType;
      }
      if (params.minPrice) {
        urlParams.minPrice = String(params.minPrice);
      }
      if (params.maxPrice) {
        urlParams.maxPrice = String(params.maxPrice);
      }
      if (params.bedrooms) {
        urlParams.bedrooms = params.bedrooms;
      }
      if (params.bathrooms) {
        urlParams.bathrooms = params.bathrooms;
      }
      if (params.status) {
        urlParams.status = params.status;
      }
      if (params.minArea) {
        urlParams.minArea = String(params.minArea);
      }
      if (params.maxArea) {
        urlParams.maxArea = String(params.maxArea);
      }

      // If AI didn't extract any params, fall back to raw search
      if (Object.keys(urlParams).length === 0) {
        urlParams.search = query.trim();
      }

      navigate("properties", urlParams);
    } catch {
      // On any error, fall back to regular search
      navigate("properties", { search: query.trim() });
    } finally {
      setIsSearching(false);
    }
  }, [query, settings, navigate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        // If AI is configured, do smart search on Enter; otherwise regular search
        if (settings.isConfigured) {
          handleSmartSearch();
        } else {
          handleRegularSearch();
        }
      }
    },
    [settings.isConfigured, handleSmartSearch, handleRegularSearch]
  );

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`
          relative flex items-center gap-2
          ${darkBackground ? "bg-white/15" : "bg-background/15"} backdrop-blur-xl
          border rounded-full p-2 shadow-2xl shadow-black/20
          transition-all duration-300
          ${darkBackground ? "border-white/25" : "border-border"}
          ${isSearching ? "border-amber-400/50 shadow-amber-400/10" : ""}
        `}
      >
        {/* Search icon or loading spinner */}
        <div className="flex items-center gap-2 flex-1 px-3">
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
          ) : settings.isConfigured ? (
            <Sparkles className="w-4 h-4 text-amber-400/80 shrink-0" />
          ) : (
            <Search className={`w-4 h-4 shrink-0 ${darkBackground ? "text-white/50" : "text-muted-foreground"}`} />
          )}
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || t("search.smartSearchHint")}
            disabled={isSearching}
            className={`
              flex-1 border-0 bg-transparent
              focus-visible:ring-0 focus-visible:ring-offset-0
              h-9 text-sm
              ${darkBackground
                ? "text-white placeholder:text-white/40"
                : "text-foreground placeholder:text-muted-foreground"
              }
            `}
          />
        </div>

        {/* AI Search button — only visible if OpenRouter is configured */}
        {settings.isConfigured && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  onClick={handleSmartSearch}
                  disabled={isSearching || !query.trim()}
                  className={`
                    rounded-full px-4 h-9 shrink-0
                    bg-gradient-to-r from-amber-500 to-amber-600
                    hover:from-amber-400 hover:to-amber-500
                    text-white font-medium text-xs
                    transition-all duration-300
                    disabled:opacity-50 disabled:cursor-not-allowed
                    shadow-md shadow-amber-500/20
                    hover:shadow-lg hover:shadow-amber-500/30
                  `}
                >
                  {isSearching ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5 me-1.5" />
                      {t("search.aiPowered")}
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-popover text-popover-foreground border-border shadow-lg"
              >
                <p className="text-xs">{t("search.aiPoweredTooltip")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Regular Search button */}
        <Button
          type="button"
          onClick={handleRegularSearch}
          disabled={isSearching || !query.trim()}
          className={`
            btn-gold rounded-full px-6 h-9 shrink-0
            transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <Search className="w-4 h-4 me-2" />
          {t("hero.searchNow")}
        </Button>
      </div>

      {/* Hint text below search bar */}
      <div className="mt-3 text-center">
        <p className={`text-xs ${darkBackground ? "text-white/40" : "text-muted-foreground"}`}>
          {settings.isConfigured ? (
            <>
              <Sparkles className="w-3 h-3 inline-block me-1 text-amber-400/60" />
              {t("search.tryExample")}: &quot;{t("search.exampleQuery")}&quot;
            </>
          ) : (
            t("hero.searchPlaceholder")
          )}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-xs text-destructive text-center">{error}</p>
      )}
    </div>
  );
}
