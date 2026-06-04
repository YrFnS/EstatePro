import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function PropertyDetailLoading() {
  return (
    <div className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumbs */}
        <Skeleton className="h-5 w-64 mb-4" />

        {/* Back button */}
        <Skeleton className="h-9 w-24 mb-6" />

        {/* Action buttons row */}
        <div className="flex items-center justify-end gap-2 mb-3">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>

        {/* Image Gallery Skeleton */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-xl overflow-hidden">
            {/* Main image */}
            <Skeleton className="h-72 md:col-span-2 md:row-span-2 md:h-full rounded-none" />
            {/* Thumbnail images */}
            <Skeleton className="h-36 md:col-span-1 rounded-none" />
            <Skeleton className="h-36 md:col-span-1 rounded-none" />
            <Skeleton className="h-36 md:col-span-1 rounded-none" />
            <Skeleton className="h-36 md:col-span-1 rounded-none" />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Price */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-8 w-3/4" />
                <div className="flex items-center gap-1">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <div className="text-start sm:text-end space-y-2">
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>

            {/* Overview Stats Card */}
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-24 mb-4" />
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="text-center p-3 rounded-lg bg-muted/50 space-y-2">
                      <Skeleton className="h-5 w-5 mx-auto rounded-full" />
                      <Skeleton className="h-6 w-8 mx-auto" />
                      <Skeleton className="h-3 w-10 mx-auto" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Description Card */}
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-28 mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>

            {/* Features/Amenities Card */}
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-28 mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Agent Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </CardContent>
            </Card>

            {/* Mortgage Calculator Card */}
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <div className="mt-4 p-4 rounded-lg bg-muted/50 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-7 w-32" />
                </div>
              </CardContent>
            </Card>

            {/* Schedule Tour Card */}
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <Skeleton className="h-10 w-full rounded-md mt-4" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
