export default function VerifyLoading() {
  return (
    <main className="min-h-dvh flex items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-4 text-center max-w-xs">
        <div
          className="size-12 rounded-2xl flex items-center justify-center shadow-sm animate-pulse"
          style={{ background: "linear-gradient(135deg, #3d46cc, #06b6d4)" }}
        >
          <span className="text-white text-lg font-bold">ES</span>
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold">กำลังสร้าง workspace…</p>
          <p className="text-sm text-muted-foreground">อาจใช้เวลา 20–40 วินาที กรุณารอสักครู่</p>
        </div>
        <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-[progress_3s_ease-in-out_infinite]" style={{ width: "60%" }} />
        </div>
      </div>
    </main>
  );
}
