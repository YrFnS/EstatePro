import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      {/* Decorative background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -start-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -end-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Logo / Brand skeleton */}
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="text-white"
              >
                <path
                  d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 22V12H15V22"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-xl border-2 border-primary/30 animate-ping" />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            <span className="gradient-text">EstatePro</span>
          </span>
        </div>

        {/* Spinner */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>

        {/* Loading text skeleton */}
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}
