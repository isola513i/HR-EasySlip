export default function PlatformLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-1.5">
        <div className="h-7 w-48 rounded-lg bg-muted" />
        <div className="h-4 w-32 rounded bg-muted/60" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-muted" />
    </div>
  );
}
