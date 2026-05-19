import { getPlatformSession } from "@/lib/auth/platform";
import { redirect } from "next/navigation";
import { PlatformSignInForm } from "./sign-in-form";

export const metadata = { title: "Sign In — EasySlip Platform" };

export default async function PlatformSignInPage() {
  const session = await getPlatformSession();
  if (session) redirect("/overview");

  return (
    <div className="dark min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-8 bg-card rounded-xl border border-border">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">EasySlip Platform</h1>
          <p className="text-sm text-muted-foreground mt-1">Staff access only</p>
        </div>
        <PlatformSignInForm
          devEmail={process.env.NODE_ENV === "development" ? (process.env.PLATFORM_ADMIN_EMAIL ?? "admin@easyslip.app") : undefined}
          devPassword={process.env.NODE_ENV === "development" ? (process.env.PLATFORM_ADMIN_PASSWORD ?? "EasySlip@Admin2026") : undefined}
        />
      </div>
    </div>
  );
}
