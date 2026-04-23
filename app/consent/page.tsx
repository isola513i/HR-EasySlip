import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { hasActiveConsent } from "@/lib/consent/consent-service";
import { ConsentForm } from "./consent-form";

export const metadata: Metadata = { title: "PDPA Consent — EasySlip HR" };

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/employee/today";

  const consented = await hasActiveConsent(session.user.id);
  if (consented) redirect(callbackUrl);

  return (
    <main className="grid min-h-dvh place-items-center bg-muted/30 px-6 py-12">
      <ConsentForm callbackUrl={callbackUrl} />
    </main>
  );
}
