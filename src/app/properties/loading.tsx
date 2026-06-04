import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

function SkeletonPropertyCard() {
  return (
    <Card className="overflow-hidden">
      {/* Image placeholder */}
      <Skeleton className="h-56 w-full rounded-none" />
      <CardContent className="p-4 space-y-3">
        {/* Price */}
        <Skeleton className="h-6 w-2/3" />
        {/* Price per sqft */}
        <Skeleton className="h-3 w-1/3" />
        {/* Title */}
        <Skeleton className="h-5 w-4/5" />
        {/* Location */}
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-3.5 w-3.5 rounded-full" />
          <Skeleton className="h-4 w-3/5" />
        </div>
        {/* Amenities divider */}
        <div className="border-t pt-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-px w-px" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-px w-px" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonFilterSidebar() {
  return (
    <div className="hidden lg:block w-72 shrink-0">
      <div className="sticky top-24">
        <Card>
          <CardContent className="p-4 space-y-5">
            {/* Filter header */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>
            {/* Featured toggle */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
            {/* Status select */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            {/* Type select */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            {/* Bedrooms */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <div className="flex flex-wrap gap-1.5">
                <Skeleton className="h-8 w-14 rounded-md" />
                <Skeleton className="h-8 w-10 rounded-md" />
                <Skeleton className="h-8 w-10 rounded-md" />
                <Skeleton className="h-8 w-10 rounded-md" />
                <Skeleton className="h-8 w-10 rounded-md" />
              </div>
            </div>
            {/* Bathrooms */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <div className="flex flex-wrap gap-1.5">
                <Skeleton className="h-8 w-14 rounded-md" />
                <Skeleton className="h-8 w-10 rounded-md" />
                <Skeleton className="h-8 w-10 rounded-md" />
                <Skeleton className="h-8 w-10 rounded-md" />
              </div>
            </div>
            {/* Price range */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-full rounded-full" />
            </div>
            {/* Area range */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PropertiesLoading() {
  return (
    <div className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-28 rounded-md lg:hidden" />
            <Skeleton className="h-10 w-44 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>

        {/* Main Layout: Sidebar + Content */}
        <div className="flex gap-6">
          {/* Filter Sidebar Skeleton */}
          <SkeletonFilterSidebar />

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {/* Results count */}
            <Skeleton className="h-4 w-24 mb-4" />

            {/* Property Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonPropertyCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
