"use client";

/** Skeleton shown while grid-view properties are loading. */
export function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i}>
          <div className="aspect-[4/3] bg-muted animate-pulse rounded-sm" />
          <div className="pt-3 space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton shown while list-view properties are loading. */
export function ListSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col sm:flex-row gap-0">
          <div className="sm:w-64 h-48 sm:h-40 bg-muted animate-pulse shrink-0" />
          <div className="flex-1 p-5 space-y-3">
            <div className="h-5 bg-muted rounded animate-pulse w-1/3" />
            <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
            <div className="h-3 bg-muted rounded animate-pulse w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton shown while map-view properties are loading. */
export function MapSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[600px]">
      <div className="flex-1 bg-muted/30 animate-pulse" />
      <div className="w-full lg:w-80 bg-muted/30 animate-pulse" />
    </div>
  );
}
