"use client";

import { useCallback, useMemo } from "react";
import {
  usePathname,
  useRouter as useNextRouter,
  useSearchParams,
} from "next/navigation";

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
export type NavigationParams = Record<string, string | undefined>;

function getView(pathname: string): View {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/properties/")) return "property-detail";
  if (pathname === "/properties") return "properties";
  if (pathname.startsWith("/agents/")) return "agent-detail";
  if (pathname === "/agents") return "agents";

  const segment = pathname.slice(1).split("/")[0];
  return segment in routes ? (segment as View) : "home";
}

export function useRouter() {
  const router = useNextRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = useMemo(() => getView(pathname), [pathname]);

  const params = useMemo(() => {
    const values: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      values[key] = value;
    });

    if (view === "property-detail" || view === "agent-detail") {
      const id = pathname.split("/")[2];
      if (id) values.id = id;
    }

    return values;
  }, [pathname, searchParams, view]);

  const navigate = useCallback(
    (nextView: View, nextParams?: NavigationParams) => {
      let destination: string = routes[nextView] || "/";

      if (nextView === "property-detail" && nextParams?.id) {
        destination = `/properties/${encodeURIComponent(nextParams.id)}`;
      } else if (nextView === "agent-detail" && nextParams?.id) {
        destination = `/agents/${encodeURIComponent(nextParams.id)}`;
      } else if (nextParams) {
        const query = new URLSearchParams();
        Object.entries(nextParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && String(value).trim() !== "") {
            query.set(key, String(value));
          }
        });
        const serialized = query.toString();
        if (serialized) destination = `${destination}?${serialized}`;
      }

      router.push(destination);
      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
      }
    },
    [router]
  );

  const back = useCallback(() => router.back(), [router]);

  return { view, params, navigate, back };
}
