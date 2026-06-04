"use client";

import { useRouter, type View } from "@/lib/router";
import { ChevronRight, Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface BreadcrumbItemData {
  label: string;
  view?: View;
  params?: Record<string, string>;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItemData[];
  currentPage?: string;
}

export function BreadcrumbNav({ items, currentPage }: BreadcrumbNavProps) {
  const { navigate } = useRouter();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Home item */}
        <BreadcrumbItem>
          <BreadcrumbLink
            className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => navigate("home")}
          >
            <Home className="w-3.5 h-3.5 inline-block me-1" />
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>

        {/* Dynamic items */}
        {items.map((item, idx) => (
          <span key={idx} className="contents">
            <BreadcrumbSeparator>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              {idx === items.length - 1 && !item.view ? (
                <BreadcrumbPage className="truncate max-w-[200px] text-foreground font-medium">
                  {item.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => {
                    if (item.view) {
                      navigate(item.view, item.params);
                    }
                  }}
                >
                  {item.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}

        {/* Current page (if separate from items) */}
        {currentPage && (
          <>
            <BreadcrumbSeparator>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="truncate max-w-[200px] text-foreground font-medium">
                {currentPage}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
