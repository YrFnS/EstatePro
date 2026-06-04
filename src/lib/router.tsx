"use client";

import { useRouter as useNextRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

// Map of route paths
const routes = {
  home: "/",
  properties: "/properties",
  "property-detail": "/properties",
  agents: "/agents",
  "agent-detail": "/agents",
  about: "/about",
  contact: "/contact",
  calculator: "/calculator",
  favorites: "/favorites",
  compare: "/compare",
  "list-property": "/list-property",
  "saved-searches": "/saved-searches",
  "ai-recommend": "/ai-recommend",
  valuation: "/valuation",
  "neighborhood-guide": "/neighborhood-guide",
  notifications: "/notifications",
  dashboard: "/dashboard",
  "my-tours": "/my-tours",
  "property-alerts": "/property-alerts",
  "market-insights": "/market-insights",
  messaging: "/messaging",
  "virtual-tour": "/virtual-tour",
  commute: "/commute",
  settings: "/settings",
  admin: "/admin",
} as const;

export type View = keyof typeof routes;

export function useRouter() {
  const nextRouter = useNextRouter();
  const pathname = usePathname();

  const navigate = useCallback(
    (view: View, params?: Record<string, string>) => {
      const basePath = routes[view] || "/";

      if (view === "property-detail" && params?.id) {
        nextRouter.push(`/properties/${params.id}`);
      } else if (view === "agent-detail" && params?.id) {
        nextRouter.push(`/agents/${params.id}`);
      } else if (view === "admin") {
        window.open("/admin", "_blank");
      } else if (params && Object.keys(params).length > 0) {
        const filteredParams: Record<string, string> = {};
        // Filter out navigation-only params that shouldn't appear in URL
        for (const [key, value] of Object.entries(params)) {
          if (key !== "id" || (view !== "property-detail" && view !== "agent-detail")) {
            filteredParams[key] = value;
          }
        }
        const query = new URLSearchParams(filteredParams).toString();
        if (query) {
          nextRouter.push(`${basePath}?${query}`);
        } else {
          nextRouter.push(basePath);
        }
      } else {
        nextRouter.push(basePath);
      }

      // Scroll to top on navigation
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [nextRouter]
  );

  const back = useCallback(() => {
    nextRouter.back();
  }, [nextRouter]);

  // Derive current view from pathname
  let view: View = "home";
  if (pathname === "/") {
    view = "home";
  } else if (pathname === "/properties") {
    view = "properties";
  } else if (pathname.startsWith("/properties/")) {
    view = "property-detail";
  } else if (pathname === "/agents") {
    view = "agents";
  } else if (pathname.startsWith("/agents/")) {
    view = "agent-detail";
  } else if (pathname === "/admin") {
    view = "admin";
  } else if (pathname === "/messaging") {
    view = "messaging";
  } else {
    const segment = pathname.slice(1);
    if (segment in routes) {
      view = segment as View;
    }
  }

  // Parse params from URL path
  const params: Record<string, string> = {};
  // Extract ID from path for detail pages
  if (view === "property-detail") {
    const id = pathname.split("/")[2];
    if (id) params.id = id;
  }
  if (view === "agent-detail") {
    const id = pathname.split("/")[2];
    if (id) params.id = id;
  }

  // Parse query params from URL if available (client-side only)
  if (typeof window !== "undefined") {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.forEach((value, key) => {
        params[key] = value;
      });
    } catch {
      // Ignore URL parsing errors during SSR
    }
  }

  return { view, params, navigate, back };
}
