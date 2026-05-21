import { getPlatformSession } from "@/lib/auth/platform";
import { PlatformShell } from "@/components/platform/platform-shell";
import { DarkModeHtml } from "./dark-mode";

export const metadata = { title: "EasySlip Platform" };

// Auth enforcement for protected routes is handled by middleware. The layout
// only renders the shell (with nav + sign-out) when a session is present so
// the /signin page can render without recursive auth checks.
export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await getPlatformSession();

  if (!session) return <>{children}</>;

  return (
    <div className="dark">
      <DarkModeHtml />
      <PlatformShell email={session.email}>{children}</PlatformShell>
    </div>
  );
}
