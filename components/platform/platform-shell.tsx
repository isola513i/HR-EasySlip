import Link from "next/link";
import { platformSignOut } from "@/app/platform/signin/actions";
import { PlatformNav } from "./platform-nav";

interface PlatformShellProps {
  children: React.ReactNode;
  email: string;
}

export function PlatformShell({ children, email }: PlatformShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="h-14 border-b border-border px-6 flex items-center justify-between sticky top-0 z-40 bg-card">
        <div className="flex items-center gap-5">
          <Link href="/platform/overview" className="text-sm font-semibold text-foreground tracking-tight">
            EasySlip <span className="text-muted-foreground font-normal">Platform</span>
          </Link>
          <PlatformNav />
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground hidden sm:inline text-xs">{email}</span>
          <form action={platformSignOut}>
            <button
              type="submit"
              className="text-muted-foreground hover:text-foreground transition-colors duration-150 text-xs"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-[1400px] mx-auto px-6 lg:px-8 py-10">
        {children}
      </main>
    </div>
  );
}
