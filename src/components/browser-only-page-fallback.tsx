type BrowserOnlyPageFallbackProps = {
  label: string;
};

export function BrowserOnlyPageFallback({
  label,
}: BrowserOnlyPageFallbackProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="container mx-auto px-4 py-10"
    >
      <span className="sr-only">{label}</span>
      <div className="space-y-6 animate-pulse" aria-hidden="true">
        <div className="space-y-3">
          <div className="h-9 w-64 max-w-full rounded-lg bg-muted" />
          <div className="h-4 w-96 max-w-full rounded bg-muted" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="h-44 bg-muted" />
              <div className="space-y-3 p-4">
                <div className="h-5 w-3/4 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
